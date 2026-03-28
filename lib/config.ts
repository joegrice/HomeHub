/** National Rail CRS station code for the trains widget (e.g. `"WAT"`, `"MAN"`). */
export const STATION_CRS = process.env.STATION_CRS ?? 'VIC';

/** Base URL for the Huxley2 National Rail Darwin proxy. */
export const HUXLEY2_BASE = 'https://huxley2.azurewebsites.net';

/** Optional Huxley2 access token. Appended as `?accessToken=...` when set. */
export const HUXLEY2_TOKEN = process.env.HUXLEY2_TOKEN ?? '';

/** Latitude fallback used when `WEATHER_POSTCODE` is not set. */
export const WEATHER_LAT = parseFloat(process.env.WEATHER_LAT ?? '52.4796');

/** Longitude fallback used when `WEATHER_POSTCODE` is not set. */
export const WEATHER_LNG = parseFloat(process.env.WEATHER_LNG ?? '-1.9026');

/** IANA timezone identifier used for all date/time display. */
export const TIMEZONE = 'Europe/London';

/**
 * Reads a refresh interval from an environment variable and converts it to milliseconds.
 * Accepts decimal minute values (e.g. `"0.5"` → 30 000 ms).
 *
 * @param envKey The name of the environment variable to read.
 * @param defaultMinutes Fallback interval in minutes if the variable is absent or invalid.
 * @returns Interval in milliseconds.
 */
function minutesToMs(envKey: string, defaultMinutes: number): number {
  const val = parseFloat(process.env[envKey] ?? '')
  return (isNaN(val) ? defaultMinutes : val) * 60_000
}

/** Client-side polling interval for the trains widget (default 30 s). */
export const REFRESH_TRAINS_MS   = minutesToMs('REFRESH_TRAINS_MINUTES',   0.5);
/** Client-side polling interval for the tube widget (default 2 min). */
export const REFRESH_TUBE_MS     = minutesToMs('REFRESH_TUBE_MINUTES',      2);
/** Client-side polling interval for the weather widget (default 15 min). */
export const REFRESH_WEATHER_MS  = minutesToMs('REFRESH_WEATHER_MINUTES',   15);
/** Client-side polling interval for the calendar widget (default 5 min). */
export const REFRESH_CALENDAR_MS = minutesToMs('REFRESH_CALENDAR_MINUTES',  5);
/** Client-side polling interval for the news widget (default 5 min). */
export const REFRESH_NEWS_MS     = minutesToMs('REFRESH_NEWS_MINUTES',      5);
