import { NextResponse } from "next/server"
import { WEATHER_LAT, WEATHER_LNG } from "@/lib/config"
import type { WeatherHour, WeatherResponse } from "../types"

interface MetOfficeSlot {
  time: string
  screenTemperature?: number
  feelsLikeTemperature?: number
  precipitationRate?: number
  probOfPrecipitation?: number
  windSpeed10m?: number
  windDirectionFrom10m?: number
  screenRelativeHumidity?: number
  weatherCode?: number
}

/**
 * Resolves coordinates and a display name for the weather location.
 *
 * Priority order:
 * 1. `WEATHER_POSTCODE` env var — looked up via postcodes.io (full postcode, then outward code).
 *    Outward codes (e.g. `SW1A`) return `admin_district` as an array; the first element is used.
 * 2. `WEATHER_LAT` / `WEATHER_LNG` env vars — used directly with an empty location name.
 * 3. Hardcoded defaults from `WEATHER_LAT` / `WEATHER_LNG` constants in `lib/config.ts`.
 *
 * postcodes.io responses are cached server-side for 24 hours.
 *
 * @returns Resolved `{ lat, lng, locationName }`.
 */
async function resolveCoords(): Promise<{ lat: number; lng: number; locationName: string }> {
  const postcode = process.env.WEATHER_POSTCODE
  if (postcode) {
    const cleaned = postcode.trim().replace(/\s+/g, '')
    // Try full postcode first, then outward code (e.g. "SW1A", "M1")
    const paths = [
      `postcodes/${encodeURIComponent(cleaned)}`,
      `outcodes/${encodeURIComponent(cleaned)}`,
    ]
    for (const path of paths) {
      const res = await fetch(`https://api.postcodes.io/${path}`, { next: { revalidate: 86400 } })
      if (!res.ok) continue
      const json = await res.json()
      const r = json.result ?? {}
      if (r.latitude && r.longitude) {
        const district = Array.isArray(r.admin_district)
          ? r.admin_district[0]
          : r.admin_district
        return {
          lat: r.latitude,
          lng: r.longitude,
          locationName: district ?? r.outcode ?? postcode,
        }
      }
    }
  }
  return { lat: WEATHER_LAT, lng: WEATHER_LNG, locationName: '' }
}

/** `GET /api/weather` — returns location name and hourly forecast. Server cache: 15 min. */
export async function GET() {
  const apiKey = process.env.METOFFICE_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "METOFFICE_API_KEY not configured" },
      { status: 500 }
    )
  }

  try {
    const { lat, lng, locationName: resolvedName } = await resolveCoords()

    const url = `https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/hourly?latitude=${lat}&longitude=${lng}&includeLocationName=true`
    const res = await fetch(url, {
      headers: { apikey: apiKey },
      next: { revalidate: 900 },
    })
    if (!res.ok) throw new Error(`Met Office API returned ${res.status}`)

    const json = await res.json()
    const props = json.features?.[0]?.properties ?? {}
    const slots: MetOfficeSlot[] = props.timeSeries ?? []

    const locationName = resolvedName || (props.location?.name as string | undefined) || ''

    const hours: WeatherHour[] = slots.map((s) => ({
      time: s.time,
      screenTemperature: s.screenTemperature ?? 0,
      feelsLikeTemperature: s.feelsLikeTemperature ?? 0,
      precipitationRate: s.precipitationRate ?? 0,
      probOfPrecipitation: s.probOfPrecipitation ?? 0,
      windSpeed10m: s.windSpeed10m ?? 0,
      windDirectionFrom10m: s.windDirectionFrom10m ?? 0,
      screenRelativeHumidity: s.screenRelativeHumidity ?? 0,
      weatherCode: s.weatherCode ?? 0,
    }))

    const response: WeatherResponse = { locationName, hours }
    return NextResponse.json(response)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch weather" },
      { status: 500 }
    )
  }
}
