"use client"

import { cn } from "@/lib/utils"

interface WidgetCardProps {
  children: React.ReactNode
  /** Additional Tailwind classes to merge onto the card container. */
  className?: string
}

/**
 * Base card shell used by every dashboard widget.
 * Provides consistent dark background, border, padding, and shadow.
 */
export default function WidgetCard({ children, className }: WidgetCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#1e1e2e] p-5 shadow-lg bg-[#111118] h-full",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Standardised widget header row with a label, an optional animated "live" indicator,
 * and an optional right-side action slot (e.g. a refresh button).
 *
 * @param label Text label displayed in uppercase small caps.
 * @param live When true, renders an animated green pulse dot to signal live data.
 * @param children Optional content rendered on the right side of the header (e.g. refresh button).
 */
export function CardHeader({
  label,
  live = false,
  children,
}: {
  label: string
  live?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {live && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
          </span>
        )}
        <span className="text-xs uppercase tracking-widest text-[#6b7280] font-medium">
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}
