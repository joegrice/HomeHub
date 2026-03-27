import {
  Sun,
  Moon,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  type LucideIcon,
} from "lucide-react"

/** Human-readable label and Lucide icon for a WMO weather interpretation code. */
export interface WeatherCodeInfo {
  label: string
  icon: LucideIcon
}

interface WeatherCodeEntry {
  label: string
  dayIcon: LucideIcon
  /** Icon to use between dusk and dawn (20:00–06:59 local time). Defaults to dayIcon if omitted. */
  nightIcon?: LucideIcon
}

/**
 * Mapping of WMO weather interpretation codes to display label and day/night icons.
 * Codes follow the WMO SYNOP standard subset used by the Met Office DataHub.
 * Reference: https://www.nodc.noaa.gov/archive/arc0021/0002199/1.1/data/0-data/HTML/WMO-CODE/WMO4677.HTM
 */
const WEATHER_CODES: Record<number, WeatherCodeEntry> = {
  0:  { label: "Clear sky",            dayIcon: Sun,            nightIcon: Moon },
  1:  { label: "Mainly clear",         dayIcon: CloudSun,       nightIcon: CloudMoon },
  2:  { label: "Partly cloudy",        dayIcon: CloudSun,       nightIcon: CloudMoon },
  3:  { label: "Overcast",             dayIcon: Cloud },
  45: { label: "Fog",                  dayIcon: CloudFog },
  48: { label: "Icy fog",              dayIcon: CloudFog },
  51: { label: "Light drizzle",        dayIcon: CloudDrizzle },
  53: { label: "Drizzle",              dayIcon: CloudDrizzle },
  55: { label: "Heavy drizzle",        dayIcon: CloudDrizzle },
  61: { label: "Light rain",           dayIcon: CloudRain },
  63: { label: "Rain",                 dayIcon: CloudRain },
  65: { label: "Heavy rain",           dayIcon: CloudRain },
  71: { label: "Light snow",           dayIcon: CloudSnow },
  73: { label: "Snow",                 dayIcon: CloudSnow },
  75: { label: "Heavy snow",           dayIcon: CloudSnow },
  77: { label: "Snow grains",          dayIcon: CloudSnow },
  80: { label: "Light showers",        dayIcon: CloudRain },
  81: { label: "Showers",              dayIcon: CloudRain },
  82: { label: "Heavy showers",        dayIcon: CloudRain },
  85: { label: "Snow showers",         dayIcon: CloudSnow },
  86: { label: "Heavy snow showers",   dayIcon: CloudSnow },
  95: { label: "Thunderstorm",         dayIcon: CloudLightning },
  96: { label: "Thunderstorm w/ hail", dayIcon: CloudLightning },
  99: { label: "Heavy thunderstorm",   dayIcon: CloudLightning },
}

/**
 * Looks up display info for a WMO weather code.
 * Falls back to `{ label: "Unknown", icon: Cloud }` for unrecognised codes.
 *
 * @param code WMO weather interpretation code from the Met Office hourly response.
 * @param hourLocal Hour of day in local time (0–23). Used to select day vs night icon.
 *   Hours 0–6 and 20–23 are treated as night.
 * @returns `WeatherCodeInfo` containing a human-readable label and a Lucide icon component.
 */
export function getWeatherInfo(code: number, hourLocal?: number): WeatherCodeInfo {
  const entry = WEATHER_CODES[code] ?? { label: "Unknown", dayIcon: Cloud }
  const isNight = hourLocal !== undefined && (hourLocal < 7 || hourLocal >= 20)
  return {
    label: entry.label,
    icon: (isNight && entry.nightIcon) ? entry.nightIcon : entry.dayIcon,
  }
}
