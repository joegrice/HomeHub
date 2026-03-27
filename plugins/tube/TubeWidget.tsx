"use client"

import { motion } from "framer-motion"
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import WidgetCard, { CardHeader } from "@/components/WidgetCard"
import { usePlugin } from "@/lib/hooks/usePlugin"
import { relativeTime } from "@/lib/utils"
import type { TubeLineStatus } from "./types"
import { TFL_LINE_COLOURS } from "./tfl-colours"
import config from "./config"

const MOCK: TubeLineStatus[] = [
  { id: "bakerloo", name: "Bakerloo", status: "Good Service", isDisrupted: false },
  { id: "central", name: "Central", status: "Minor Delays", isDisrupted: true },
  { id: "circle", name: "Circle", status: "Good Service", isDisrupted: false },
  { id: "district", name: "District", status: "Good Service", isDisrupted: false },
  { id: "hammersmith-city", name: "Hammersmith & City", status: "Good Service", isDisrupted: false },
  { id: "jubilee", name: "Jubilee", status: "Severe Delays", isDisrupted: true },
  { id: "metropolitan", name: "Metropolitan", status: "Good Service", isDisrupted: false },
  { id: "northern", name: "Northern", status: "Good Service", isDisrupted: false },
  { id: "piccadilly", name: "Piccadilly", status: "Good Service", isDisrupted: false },
  { id: "victoria", name: "Victoria", status: "Good Service", isDisrupted: false },
  { id: "waterloo-city", name: "Waterloo & City", status: "Good Service", isDisrupted: false },
  { id: "elizabeth", name: "Elizabeth line", status: "Part Suspended", isDisrupted: true },
]

function statusColour(status: string): string {
  if (status === "Good Service") return "#22c55e"
  if (status === "Minor Delays") return "#f59e0b"
  return "#ef4444"
}

function LineRow({ line }: { line: TubeLineStatus }) {
  const colour = TFL_LINE_COLOURS[line.id] ?? "#6b7280"
  const textColour = statusColour(line.status)
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: colour }}
      />
      <span className="text-sm text-white flex-1 truncate">{line.name}</span>
      <span className="text-xs font-medium" style={{ color: textColour }}>
        {line.status}
      </span>
    </div>
  )
}

export default function TubeWidget() {
  const { data, loading, error, lastUpdated, refresh } = usePlugin<TubeLineStatus[]>(
    "/api/tube",
    config.refreshMs
  )

  const lines = data ?? MOCK
  const usingMock = !data
  const disrupted = lines.filter(l => l.isDisrupted)
  const good = lines.filter(l => !l.isDisrupted)
  const allGood = disrupted.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="h-full"
    >
      <WidgetCard>
        <CardHeader label="London Tube" live>
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
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-7 w-full bg-[#1e1e2e]" />)}
          </div>
        ) : (
          <div>
            {allGood ? (
              <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 mb-3">
                <CheckCircle className="h-4 w-4 text-[#22c55e]" />
                <span className="text-sm text-[#22c55e] font-medium">All lines good service</span>
              </div>
            ) : (
              <div>
                {disrupted.map(line => <LineRow key={line.id} line={line} />)}
              </div>
            )}

            {!allGood && (
              <div>
                {good.map(line => <LineRow key={line.id} line={line} />)}
              </div>
            )}

            {allGood && (
              <div>
                {lines.map(line => <LineRow key={line.id} line={line} />)}
              </div>
            )}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-[#1e1e2e] flex items-center gap-2 text-[10px] text-[#6b7280]">
          {usingMock ? (
            <span>Mock data — configure TFL_API_KEY</span>
          ) : lastUpdated ? (
            <span>Updated {relativeTime(lastUpdated)}</span>
          ) : null}
        </div>
      </WidgetCard>
    </motion.div>
  )
}
