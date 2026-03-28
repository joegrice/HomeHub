"use client"

import { motion } from "framer-motion"
import { RefreshCw, AlertCircle, Wind, Droplets } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import WidgetCard, { CardHeader } from "@/components/WidgetCard"
import { usePlugin } from "@/lib/hooks/usePlugin"
import { relativeTime } from "@/lib/utils"
import { getWeatherInfo } from "./weather-codes"
import type { WeatherHour, WeatherResponse } from "./types"
import config from "./config"
import { formatInTimeZone } from "date-fns-tz"
import { parseISO } from "date-fns"

const TZ = "Europe/London"

const MOCK: WeatherHour[] = [
  { time: "2026-03-27T08:00:00Z", screenTemperature: 9, feelsLikeTemperature: 6, precipitationRate: 0, probOfPrecipitation: 10, windSpeed10m: 12, windDirectionFrom10m: 225, screenRelativeHumidity: 72, weatherCode: 2 },
  { time: "2026-03-27T09:00:00Z", screenTemperature: 10, feelsLikeTemperature: 7, precipitationRate: 0, probOfPrecipitation: 5, windSpeed10m: 14, windDirectionFrom10m: 230, screenRelativeHumidity: 70, weatherCode: 3 },
  { time: "2026-03-27T10:00:00Z", screenTemperature: 11, feelsLikeTemperature: 8, precipitationRate: 0.1, probOfPrecipitation: 40, windSpeed10m: 15, windDirectionFrom10m: 240, screenRelativeHumidity: 75, weatherCode: 61 },
  { time: "2026-03-27T11:00:00Z", screenTemperature: 11, feelsLikeTemperature: 8, precipitationRate: 0.3, probOfPrecipitation: 70, windSpeed10m: 16, windDirectionFrom10m: 240, screenRelativeHumidity: 80, weatherCode: 63 },
  { time: "2026-03-27T12:00:00Z", screenTemperature: 12, feelsLikeTemperature: 9, precipitationRate: 0.2, probOfPrecipitation: 55, windSpeed10m: 14, windDirectionFrom10m: 235, screenRelativeHumidity: 78, weatherCode: 61 },
  { time: "2026-03-27T13:00:00Z", screenTemperature: 13, feelsLikeTemperature: 10, precipitationRate: 0, probOfPrecipitation: 15, windSpeed10m: 12, windDirectionFrom10m: 220, screenRelativeHumidity: 70, weatherCode: 2 },
  { time: "2026-03-27T14:00:00Z", screenTemperature: 13, feelsLikeTemperature: 10, precipitationRate: 0, probOfPrecipitation: 5, windSpeed10m: 11, windDirectionFrom10m: 215, screenRelativeHumidity: 68, weatherCode: 1 },
  { time: "2026-03-27T15:00:00Z", screenTemperature: 12, feelsLikeTemperature: 9, precipitationRate: 0, probOfPrecipitation: 5, windSpeed10m: 10, windDirectionFrom10m: 210, screenRelativeHumidity: 70, weatherCode: 2 },
  { time: "2026-03-27T16:00:00Z", screenTemperature: 11, feelsLikeTemperature: 8, precipitationRate: 0.1, probOfPrecipitation: 30, windSpeed10m: 12, windDirectionFrom10m: 220, screenRelativeHumidity: 75, weatherCode: 80 },
  { time: "2026-03-27T17:00:00Z", screenTemperature: 10, feelsLikeTemperature: 7, precipitationRate: 0, probOfPrecipitation: 10, windSpeed10m: 11, windDirectionFrom10m: 215, screenRelativeHumidity: 73, weatherCode: 3 },
  { time: "2026-03-27T18:00:00Z", screenTemperature: 9, feelsLikeTemperature: 6, precipitationRate: 0, probOfPrecipitation: 5, windSpeed10m: 9, windDirectionFrom10m: 200, screenRelativeHumidity: 76, weatherCode: 3 },
  { time: "2026-03-27T19:00:00Z", screenTemperature: 8, feelsLikeTemperature: 5, precipitationRate: 0, probOfPrecipitation: 5, windSpeed10m: 8, windDirectionFrom10m: 195, screenRelativeHumidity: 78, weatherCode: 2 },
]

function windDirectionLabel(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  return dirs[Math.round(deg / 45) % 8]
}

export default function WeatherWidget() {
  const { data, loading, error, lastUpdated, refresh } = usePlugin<WeatherResponse>(
    "/api/weather",
    config.refreshMs
  )

  const hours = data?.hours ?? MOCK
  const usingMock = !data
  const locationName = data?.locationName
  const current = hours[0]
  const currentHourLocal = current ? parseInt(formatInTimeZone(parseISO(current.time), TZ, "H"), 10) : undefined
  const info = current ? getWeatherInfo(current.weatherCode, currentHourLocal) : null
  const Icon = info?.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="h-full"
    >
      <WidgetCard>
        <CardHeader label={locationName ? `Weather — ${locationName}` : "Weather"} live>
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
            <Skeleton className="h-20 w-full bg-[#1e1e2e]" />
            <Skeleton className="h-16 w-full bg-[#1e1e2e]" />
          </div>
        ) : current && info && Icon ? (
          <>
            {/* Hero */}
            <div className="flex items-center gap-4 mb-5">
              <div className="p-3 rounded-xl bg-[#1a1a28] border border-[#1e1e2e]">
                <Icon className="h-8 w-8 text-[#3b82f6]" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-4xl font-mono font-bold text-white tabular-nums"
                    style={{ fontFamily: "var(--font-geist-mono)" }}
                  >
                    {Math.round(current.screenTemperature)}°C
                  </span>
                  <span className="text-sm text-[#6b7280]">
                    feels {Math.round(current.feelsLikeTemperature)}°C
                  </span>
                </div>
                <p className="text-sm text-white mt-0.5">{info.label}</p>
              </div>
              <div className="ml-auto flex flex-col gap-1.5 text-xs text-[#6b7280]">
                <div className="flex items-center gap-1.5">
                  <Wind className="h-3 w-3" />
                  <span>{Math.round(current.windSpeed10m)} mph {windDirectionLabel(current.windDirectionFrom10m)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Droplets className="h-3 w-3" />
                  <span>{Math.round(current.screenRelativeHumidity)}% humidity</span>
                </div>
              </div>
            </div>

            {/* Hourly strip */}
            <div className="overflow-x-auto scrollbar-thin pb-1">
              <div className="flex gap-2" style={{ minWidth: "max-content" }}>
                {hours.slice(0, 12).map((hour, i) => {
                  const timeStr = formatInTimeZone(parseISO(hour.time), TZ, "HH:mm")
                  const hourLocal = parseInt(timeStr.split(":")[0], 10)
                  const hInfo = getWeatherInfo(hour.weatherCode, hourLocal)
                  const HIcon = hInfo.icon
                  return (
                    <div
                      key={i}
                      className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-lg border min-w-[72px] ${
                        i === 0
                          ? "border-[#3b82f6]/40 bg-[#3b82f6]/5"
                          : "border-[#1e1e2e] bg-[#1a1a28]"
                      }`}
                    >
                      <span className="text-xs font-mono text-[#6b7280]" style={{ fontFamily: "var(--font-geist-mono)" }}>
                        {timeStr}
                      </span>
                      <HIcon className="h-5 w-5 text-[#6b7280]" />
                      <span className="text-sm font-mono font-bold text-white" style={{ fontFamily: "var(--font-geist-mono)" }}>
                        {Math.round(hour.screenTemperature)}°
                      </span>
                      <div className="flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-[#3b82f6]" />
                        <span className="text-[10px] font-mono text-[#3b82f6]" style={{ fontFamily: "var(--font-geist-mono)" }}>
                          {hour.probOfPrecipitation}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="text-[10px] text-[#6b7280] leading-none"
                          style={{ display: "inline-block", transform: `rotate(${(hour.windDirectionFrom10m + 180) % 360}deg)` }}
                        >
                          ↑
                        </span>
                        <span className="text-[10px] font-mono text-[#6b7280]" style={{ fontFamily: "var(--font-geist-mono)" }}>
                          {Math.round(hour.windSpeed10m)}mph
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : null}

        <div className="mt-auto pt-3 border-t border-[#1e1e2e] text-[10px] text-[#6b7280]">
          {usingMock ? (
            <span>Mock data — configure METOFFICE_API_KEY</span>
          ) : lastUpdated ? (
            <span>Updated {relativeTime(lastUpdated)}</span>
          ) : null}
        </div>
      </WidgetCard>
    </motion.div>
  )
}
