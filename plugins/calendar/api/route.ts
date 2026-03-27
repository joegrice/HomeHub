import { NextResponse } from "next/server"
import type { CalendarEvent } from "../types"

/**
 * Fetches and parses today's events from an iCal/CalDAV URL (`ICAL_URL` env var).
 * Handles both single and recurring events. Recurring events are expanded via
 * `ICAL.RecurExpansion` with a cap of 500 occurrences per rule to guard against
 * unbounded rules. `webcal://` URLs are rewritten to `https://` before fetching.
 *
 * @returns Events whose time range overlaps with today, sorted by start time.
 * @throws When `ICAL_URL` is not set or the fetch/parse fails.
 */
async function fetchIcal(): Promise<CalendarEvent[]> {
  const icalUrl = process.env.ICAL_URL
  if (!icalUrl) throw new Error("ICAL_URL not configured")

  const fetchUrl = icalUrl.replace(/^webcal:\/\//i, 'https://')
  const res = await fetch(fetchUrl, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`Failed to fetch iCal: ${res.status}`)
  const icsText = await res.text()

  // Dynamically import ical.js (ESM)
  const ICAL = (await import("ical.js")).default

  const jcal = ICAL.parse(icsText)
  const comp = new ICAL.Component(jcal)
  const vevents = comp.getAllSubcomponents("vevent")

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const events: CalendarEvent[] = []

  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent)

    // Handle recurring events
    if (event.isRecurring()) {
      const expand = new ICAL.RecurExpansion({
        component: vevent,
        dtstart: event.startDate,
      })
      let next: InstanceType<typeof ICAL.Time> | null
      let count = 0
      while ((next = expand.next()) && count < 500) {
        count++
        const start = next.toJSDate()
        if (start > todayEnd) break
        const duration = event.duration
        const end = new Date(start.getTime() + duration.toSeconds() * 1000)
        if (end >= todayStart && start <= todayEnd) {
          events.push({
            id: `${event.uid}-${count}`,
            title: event.summary,
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            location: event.location || undefined,
            calendarName: undefined,
            isAllDay: event.startDate.isDate,
          })
        }
      }
    } else {
      const start = event.startDate.toJSDate()
      const end = event.endDate.toJSDate()
      if (end >= todayStart && start <= todayEnd) {
        events.push({
          id: event.uid,
          title: event.summary,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          location: event.location || undefined,
          calendarName: undefined,
          isAllDay: event.startDate.isDate,
        })
      }
    }
  }

  return events.sort((a, b) =>
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )
}

/**
 * Fetches today's events from the primary Google Calendar using a GCP service account.
 * The service account JSON is read from `GOOGLE_SERVICE_ACCOUNT_KEY` (single-line string).
 * Requires the calendar.readonly OAuth scope granted to the service account.
 *
 * @returns Today's events sorted by start time (Google Calendar API handles ordering).
 * @throws When `GOOGLE_SERVICE_ACCOUNT_KEY` is not set or the API call fails.
 */
async function fetchGmail(): Promise<CalendarEvent[]> {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!keyJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured")

  const { google } = await import("googleapis")
  const credentials = JSON.parse(keyJson)

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  })

  const calendar = google.calendar({ version: "v3", auth })

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin: todayStart.toISOString(),
    timeMax: todayEnd.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  })

  const items = res.data.items ?? []
  return items.map((item) => ({
    id: item.id ?? Math.random().toString(),
    title: item.summary ?? "(No title)",
    startTime: item.start?.dateTime ?? item.start?.date ?? todayStart.toISOString(),
    endTime: item.end?.dateTime ?? item.end?.date ?? todayEnd.toISOString(),
    location: item.location ?? undefined,
    calendarName: "Google Calendar",
    isAllDay: !item.start?.dateTime,
  }))
}

/** `GET /api/calendar` — returns today's events from the configured calendar source. */
export async function GET() {
  const source = process.env.CALENDAR_SOURCE ?? "ical"

  try {
    const events = source === "gmail" ? await fetchGmail() : await fetchIcal()
    return NextResponse.json(events)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch calendar" },
      { status: 500 }
    )
  }
}

