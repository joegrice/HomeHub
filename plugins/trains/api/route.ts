import { NextResponse } from "next/server"
import { HUXLEY2_BASE, HUXLEY2_TOKEN, STATION_CRS } from "@/lib/config"
import type { TrainDeparture, TrainsResponse } from "../types"

/** Subset of the Huxley2 service object used by this route. */
interface Huxley2Service {
  std?: string
  etd?: string
  platform?: string
  operatorCode?: string
  operator?: string
  destination?: Array<{ locationName: string }>
  isCancelled?: boolean
  length?: number
}

/**
 * Returns a time string, substituting a placeholder when the value is absent.
 * @param t Raw time string from Huxley2 (e.g. `"08:45"`), or `undefined`.
 * @returns The original string or `"??:??"` if absent.
 */
function parseTime(t?: string): string {
  return t ?? "??:??"
}

/**
 * Computes minutes from now until a given `"HH:mm"` time today.
 * Advances to the next calendar day if the time has already passed — this handles
 * the common case of a late-running departure at e.g. 23:58 being checked after midnight.
 * Always use the revised ETD (not scheduled STD) for delayed services to avoid
 * large spurious values when the scheduled time has rolled past midnight.
 *
 * @param timeStr Departure time in `"HH:mm"` format.
 * @returns Whole minutes until that time.
 */
function minutesUntil(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number)
  const now = new Date()
  const dep = new Date()
  dep.setHours(h, m, 0, 0)
  const diff = Math.round((dep.getTime() - now.getTime()) / 60000)
  // If the time is less than 2 hours in the past it's a recently-departed service — clamp to 0.
  // If it's more than 2 hours in the past the time crosses midnight (e.g. 00:02 checked at 23:17).
  if (diff >= -120) return Math.max(0, diff)
  dep.setDate(dep.getDate() + 1)
  return Math.round((dep.getTime() - now.getTime()) / 60000)
}

/** `GET /api/trains` — returns up to 5 departures from the configured station. */
export async function GET() {
  try {
    const token = HUXLEY2_TOKEN ? `?accessToken=${HUXLEY2_TOKEN}` : ''
    const url = `${HUXLEY2_BASE}/departures/${STATION_CRS}/10${token}`
    const res = await fetch(url, { next: { revalidate: 30 } })
    if (!res.ok) throw new Error(`Huxley2 returned ${res.status}`)

    const json = await res.json()
    const stationName: string = json.locationName ?? STATION_CRS
    const services: Huxley2Service[] = json.trainServices ?? []

    const departures: TrainDeparture[] = services.slice(0, 5).map((s) => {
      const scheduled = parseTime(s.std)
      const etd = s.etd ?? "On time"
      const cancelled = s.isCancelled === true
      const delayed = !cancelled && etd !== "On time" && etd !== "Delayed"

      return {
        scheduledTime: scheduled,
        destination: s.destination?.[0]?.locationName ?? "Unknown",
        platform: s.platform ?? null,
        operator: s.operator ?? s.operatorCode ?? "Unknown",
        status: cancelled ? "cancelled" : delayed ? "delayed" : "on-time",
        revisedTime: delayed ? etd : null,
        minutesUntil: minutesUntil(delayed ? etd : scheduled),
        carriages: s.length ?? null,
      }
    })

    const response: TrainsResponse = { stationName, departures }
    return NextResponse.json(response)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch trains" },
      { status: 500 }
    )
  }
}
