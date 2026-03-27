"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { RefreshCw, AlertCircle, MapPin, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import WidgetCard from "@/components/WidgetCard"
import { usePlugin } from "@/lib/hooks/usePlugin"
import { relativeTime, hashToHue } from "@/lib/utils"
import { formatInTimeZone } from "date-fns-tz"
import { parseISO, differenceInMinutes, isAfter, isBefore, addDays } from "date-fns"
import type { CalendarEvent } from "./types"
import config from "./config"

const TZ = "Europe/London"
const LONG_REFRESH_MS = 60 * 60 * 1000

const MOCK: CalendarEvent[] = [
  { id: "1", title: "Team standup", startTime: "2026-03-27T09:00:00Z", endTime: "2026-03-27T09:15:00Z", calendarName: "Work", isAllDay: false },
  { id: "2", title: "Dentist appointment", startTime: "2026-03-27T11:00:00Z", endTime: "2026-03-27T12:00:00Z", location: "1 High Street, Birmingham", calendarName: "Personal", isAllDay: false },
  { id: "3", title: "Lunch with Sarah", startTime: "2026-03-27T12:30:00Z", endTime: "2026-03-27T13:30:00Z", location: "The Plough, Birmingham", calendarName: "Personal", isAllDay: false },
  { id: "4", title: "Product review", startTime: "2026-03-27T15:00:00Z", endTime: "2026-03-27T16:00:00Z", calendarName: "Work", isAllDay: false },
  { id: "5", title: "Gym", startTime: "2026-03-27T18:30:00Z", endTime: "2026-03-27T19:30:00Z", location: "PureGym", calendarName: "Personal", isAllDay: false },
]

function formatDuration(startIso: string, endIso: string): string {
  const mins = differenceInMinutes(parseISO(endIso), parseISO(startIso))
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function getHeaderLabel(offset: number, date: Date): string {
  if (offset === 0) return "Today's Calendar"
  if (offset === 1) return "Tomorrow"
  if (offset === -1) return "Yesterday"
  return formatInTimeZone(date, TZ, "EEE d MMM").toUpperCase()
}

function EventRow({ event, isViewingToday }: { event: CalendarEvent; isViewingToday: boolean }) {
  const now = new Date()
  const start = parseISO(event.startTime)
  const end = parseISO(event.endTime)
  const isNow = isViewingToday && isAfter(now, start) && isBefore(now, end)
  const isSoon = isViewingToday && !isNow && differenceInMinutes(start, now) <= 30 && differenceInMinutes(start, now) > 0
  const isPast = isBefore(end, now)
  const hue = hashToHue(event.calendarName ?? "default")

  return (
    <div
      className={`flex items-start gap-3 py-2.5 px-2 rounded-lg transition-colors ${
        isNow ? "border-l-2 border-[#22c55e] pl-2 bg-[#22c55e]/5" : "hover:bg-[#1a1a28]"
      } ${isPast ? "opacity-40" : ""}`}
    >
      {/* Calendar colour dot */}
      <div
        className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0"
        style={{ backgroundColor: `hsl(${hue}, 70%, 55%)` }}
      />

      {/* Time */}
      <div className="w-[52px] flex-shrink-0">
        <span
          className="text-xs font-mono text-[#6b7280] tabular-nums"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {event.isAllDay ? "All day" : formatInTimeZone(start, TZ, "HH:mm")}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{event.title}</p>
        {event.location && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-2.5 w-2.5 text-[#6b7280] flex-shrink-0" />
            <span className="text-[10px] text-[#6b7280] truncate">{event.location}</span>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {!event.isAllDay && (
          <Badge variant="outline" className="text-[9px] border-[#1e1e2e] text-[#6b7280] px-1.5 py-0">
            {formatDuration(event.startTime, event.endTime)}
          </Badge>
        )}
        {isNow && <Badge className="text-[9px] bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 px-1.5 py-0">Now</Badge>}
        {isSoon && <Badge className="text-[9px] bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20 px-1.5 py-0">Soon</Badge>}
      </div>
    </div>
  )
}

export default function CalendarWidget() {
  const [dayOffset, setDayOffset] = useState(0)
  const isViewingToday = dayOffset === 0

  const viewDate = useMemo(() => addDays(new Date(), dayOffset), [dayOffset])
  const dateParam = useMemo(() => formatInTimeZone(viewDate, TZ, "yyyy-MM-dd"), [viewDate])

  const apiPath = isViewingToday ? "/api/calendar" : `/api/calendar?date=${dateParam}`
  const effectiveRefreshMs = isViewingToday ? config.refreshMs : LONG_REFRESH_MS

  const { data, loading, error, lastUpdated, refresh } = usePlugin<CalendarEvent[]>(
    apiPath,
    effectiveRefreshMs
  )

  // Track which date was last successfully loaded to show skeletons during day transitions
  const loadedDateRef = useRef(dateParam)
  useEffect(() => {
    if (lastUpdated) loadedDateRef.current = dateParam
  }, [lastUpdated, dateParam])
  const isTransitioning = loadedDateRef.current !== dateParam
  const showSkeletons = (loading && !data) || isTransitioning

  const events = data ?? MOCK
  const usingMock = !data

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="h-full"
    >
      <WidgetCard>
        {/* Inline header with prev/next navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[#6b7280] hover:text-white"
              onClick={() => setDayOffset(o => o - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs uppercase tracking-widest text-[#6b7280] font-medium px-1">
              {getHeaderLabel(dayOffset, viewDate)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[#6b7280] hover:text-white"
              onClick={() => setDayOffset(o => o + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {loading && <RefreshCw className="h-3 w-3 text-[#6b7280] animate-spin" />}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-[#6b7280] hover:text-white"
              onClick={refresh}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="mb-4 border-[#ef4444]/20 bg-[#ef4444]/5">
            <AlertCircle className="h-4 w-4 text-[#ef4444]" />
            <AlertDescription className="text-[#ef4444] text-sm">
              {error} <button onClick={refresh} className="underline ml-1">Retry</button>
            </AlertDescription>
          </Alert>
        )}

        {showSkeletons ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full bg-[#1e1e2e]" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <CheckCircle className="h-8 w-8 text-[#22c55e]/40" />
            <p className="text-sm text-[#6b7280]">
              {isViewingToday ? "Nothing scheduled today" : "Nothing scheduled"}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {events.map(event => (
              <EventRow key={event.id} event={event} isViewingToday={isViewingToday} />
            ))}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-[#1e1e2e] text-[10px] text-[#6b7280]">
          {usingMock ? (
            <span>Mock data — configure ICAL_URL</span>
          ) : lastUpdated ? (
            <span>Updated {relativeTime(lastUpdated)}</span>
          ) : null}
        </div>
      </WidgetCard>
    </motion.div>
  )
}
