/** A single calendar event for today, returned by `GET /api/calendar`. */
export interface CalendarEvent {
  /** Unique event identifier (iCal UID or Google Calendar event ID). */
  id: string
  /** Event title / summary. */
  title: string
  /** Event start time as an ISO 8601 string. For all-day events this is midnight UTC of the event date. */
  startTime: string
  /** Event end time as an ISO 8601 string. */
  endTime: string
  /** Optional location string from the calendar entry. */
  location?: string
  /** Source calendar name (set for Gmail; `undefined` for iCal). */
  calendarName?: string
  /** `true` when the event spans a full day with no specific start/end time. */
  isAllDay: boolean
}
