"use client"

import { useState, useEffect } from "react"
import { formatInTimeZone } from "date-fns-tz"

const TZ = "Europe/London"

export default function Header() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = now ? formatInTimeZone(now, TZ, "HH:mm:ss") : ""
  const dateStr = now ? formatInTimeZone(now, TZ, "EEE d MMM yyyy") : ""

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e1e2e] bg-[#0a0a0f]/90 backdrop-blur-sm">
      <div className="mx-auto max-w-screen-2xl px-6 py-3 flex items-center">
        {/* Left: wordmark */}
        <div className="flex-1">
          <span className="text-sm font-semibold tracking-widest uppercase text-white">
            Home<span className="text-[#3b82f6]">Hub</span>
          </span>
        </div>

        {/* Centre: clock */}
        <div className="flex-1 flex justify-center">
          <span
            className="text-lg font-mono tabular-nums text-white tracking-wider"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {timeStr}
          </span>
        </div>

        {/* Right: date */}
        <div className="flex-1 flex justify-end items-center">
          <span className="text-xs text-[#6b7280]">{dateStr}</span>
        </div>
      </div>
    </header>
  )
}
