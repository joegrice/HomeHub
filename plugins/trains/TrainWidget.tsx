"use client"

import { motion } from "framer-motion"
import { RefreshCw, AlertCircle, Train } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import WidgetCard, { CardHeader } from "@/components/WidgetCard"
import { usePlugin } from "@/lib/hooks/usePlugin"
import { relativeTime } from "@/lib/utils"
import type { TrainDeparture, TrainsResponse } from "./types"
import config from "./config"

const MOCK: TrainDeparture[] = [
  { scheduledTime: "08:15", destination: "London Liverpool Street", platform: "2", operator: "Greater Anglia", status: "on-time", revisedTime: null, minutesUntil: 4, carriages: 8 },
  { scheduledTime: "08:42", destination: "London Liverpool Street", platform: "1", operator: "Greater Anglia", status: "delayed", revisedTime: "08:57", minutesUntil: 31, carriages: null },
  { scheduledTime: "09:00", destination: "Norwich", platform: "3", operator: "Greater Anglia", status: "on-time", revisedTime: null, minutesUntil: 49, carriages: 4 },
  { scheduledTime: "09:15", destination: "London Liverpool Street", platform: "2", operator: "Greater Anglia", status: "cancelled", revisedTime: null, minutesUntil: 64, carriages: null },
  { scheduledTime: "09:42", destination: "Ipswich", platform: "1", operator: "Greater Anglia", status: "on-time", revisedTime: null, minutesUntil: 91, carriages: 8 },
]

function StatusBadge({ status, revisedTime }: { status: TrainDeparture["status"]; revisedTime: string | null }) {
  if (status === "on-time") return <Badge className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20 text-xs">On time</Badge>
  if (status === "cancelled") return <Badge className="bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20 text-xs">Cancelled</Badge>
  return (
    <div className="flex items-center gap-1">
      <Badge className="bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20 text-xs">Delayed</Badge>
      {revisedTime && <span className="text-xs text-[#f59e0b] font-mono">{revisedTime}</span>}
    </div>
  )
}

export default function TrainWidget() {
  const { data, loading, error, lastUpdated, refresh } = usePlugin<TrainsResponse>(
    "/api/trains",
    config.refreshMs
  )

  const departures = data?.departures ?? MOCK
  const stationName = data?.stationName
  const usingMock = !data

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0 }}
      className="h-full"
    >
      <WidgetCard>
        <CardHeader label={stationName ? `Next Trains — ${stationName}` : "Next Trains"} live>
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
        </CardHeader>

        {error && (
          <Alert className="mb-4 border-[#ef4444]/20 bg-[#ef4444]/5">
            <AlertCircle className="h-4 w-4 text-[#ef4444]" />
            <AlertDescription className="text-[#ef4444] text-sm">
              {error} <button onClick={refresh} className="underline ml-1">Retry</button>
            </AlertDescription>
          </Alert>
        )}

        {loading && !data ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full bg-[#1e1e2e]" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {departures.map((dep, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  dep.status === "cancelled" ? "opacity-50" : "hover:bg-[#1a1a28]"
                }`}
              >
                {/* Time */}
                <div className="flex flex-col items-start min-w-[52px]">
                  <span
                    className={`text-lg font-mono font-semibold tabular-nums ${
                      dep.status === "cancelled" ? "line-through text-[#6b7280]" : "text-white"
                    }`}
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {dep.scheduledTime}
                  </span>
                  <span className="text-[10px] text-[#6b7280] font-mono">
                    {dep.minutesUntil === 0 ? "Now" : `in ${dep.minutesUntil}m`}
                  </span>
                </div>

                {/* Destination */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{dep.destination}</p>
                  <p className="text-[10px] text-[#6b7280] truncate">
                    {dep.operator}
                    {dep.carriages && <span className="ml-1.5">{dep.carriages} carriages</span>}
                  </p>
                </div>

                {/* Platform + Status */}
                <div className="flex flex-col items-end gap-1">
                  {dep.platform && (
                    <Badge variant="outline" className="text-[10px] border-[#1e1e2e] text-[#6b7280] px-1.5 py-0">
                      Plt {dep.platform}
                    </Badge>
                  )}
                  <StatusBadge status={dep.status} revisedTime={dep.revisedTime} />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-[#1e1e2e] flex items-center gap-2 text-[10px] text-[#6b7280]">
          <Train className="h-3 w-3" />
          {usingMock ? (
            <span>Mock data — configure API</span>
          ) : lastUpdated ? (
            <span>Updated {relativeTime(lastUpdated)}</span>
          ) : null}
        </div>
      </WidgetCard>
    </motion.div>
  )
}
