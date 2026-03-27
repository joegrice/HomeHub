# HomeHub — Claude Code Reference

## Overview

HomeHub is a personal home dashboard built with Next.js 16 (App Router), TypeScript, Tailwind CSS, and shadcn/ui. It displays five live data widgets on a dark-themed single-page dashboard.

---

## Plugin Architecture

Each widget is a self-contained **plugin** living in `/plugins/{name}/`:

```
/plugins/{name}/
  config.ts          ← PluginConfig metadata (id, label, refreshMs, colSpan, enabled)
  api/route.ts       ← Next.js Route Handler — server-side data fetch, API key hidden
  {Name}Widget.tsx   ← React client component, uses usePlugin hook
  types.ts           ← TypeScript interfaces for this plugin's data
```

### Adding a new plugin

1. Create `/plugins/{name}/` with the four files above
2. Register it in `/lib/plugins-registry.ts` by adding it to the `PLUGINS` array
3. Add a re-export in `/app/api/{name}/route.ts`:
   ```ts
   export { GET } from "@/plugins/{name}/api/route"
   ```
4. Import the widget in `/app/page.tsx` and add it to the grid

### PluginConfig interface (`/lib/plugin-types.ts`)

```ts
interface PluginConfig {
  id: string
  label: string
  refreshMs: number    // polling interval in milliseconds
  colSpan: number      // 12-column grid span
  enabled: boolean
}
```

---

## Data Flow

```
Browser                     Next.js Server              External APIs
  │                              │                            │
  │  setInterval (refreshMs)     │                            │
  ├─ GET /api/{plugin} ────────►│                            │
  │                              ├─ fetch(external) ────────►│
  │                              │◄─ JSON ───────────────────┤
  │◄─ normalised JSON ──────────┤                            │
  │                              │                            │
  │  usePlugin hook updates      │                            │
  │  widget state                │                            │
```

- All external API calls are made **server-side** via Route Handlers — API keys never reach the browser
- Each widget polls independently via `usePlugin` — one failure cannot affect others
- Server-side caches use `next: { revalidate: N }` to reduce upstream calls

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STATION_CRS` | No | `CHE` | National Rail CRS code for the trains widget (e.g. `WAT`, `MAN`) |
| `HUXLEY2_TOKEN` | No | — | Huxley2 access token — register free at huxley2.azurewebsites.net |
| `TFL_API_KEY` | Yes (tube) | — | TfL Unified API key — free at api.tfl.gov.uk |
| `METOFFICE_API_KEY` | Yes (weather) | — | Met Office DataHub key — free tier at datahub.metoffice.gov.uk |
| `WEATHER_POSTCODE` | No | — | UK postcode for weather location (outward code fine, e.g. `SW1A`). Takes priority over lat/lng |
| `WEATHER_LAT` | No | `52.4796` | Latitude fallback when no postcode is set |
| `WEATHER_LNG` | No | `-1.9026` | Longitude fallback when no postcode is set |
| `CALENDAR_SOURCE` | No | `ical` | `"ical"` or `"gmail"` |
| `ICAL_URL` | If ical | — | Private iCal/CalDAV URL (iCloud, Outlook, Google Calendar). `webcal://` is automatically rewritten to `https://` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | If gmail | — | Full GCP service account JSON as a single-line string |
| `REFRESH_TRAINS_MINUTES` | No | `0.5` | Trains poll interval in minutes (decimals allowed, e.g. `0.5` = 30 s) |
| `REFRESH_TUBE_MINUTES` | No | `2` | Tube poll interval in minutes |
| `REFRESH_WEATHER_MINUTES` | No | `15` | Weather poll interval in minutes |
| `REFRESH_CALENDAR_MINUTES` | No | `5` | Calendar poll interval in minutes |
| `REFRESH_NEWS_MINUTES` | No | `5` | News poll interval in minutes |

---

## API Sources

| Plugin | Source | Docs |
|--------|--------|------|
| Trains | Huxley2 (National Rail Darwin proxy, optional token) | `https://huxley2.azurewebsites.net/departures/{CRS}/10` |
| Tube | TfL Unified API | `https://api.tfl.gov.uk/Line/Mode/tube/Status` |
| Weather | Met Office DataHub — site-specific hourly | `https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/hourly` |
| Calendar | iCal (ical.js) or Google Calendar API (googleapis) | Configured via `CALENDAR_SOURCE` |
| News | BBC News RSS | `https://feeds.bbci.co.uk/news/rss.xml` |

---

## Timezone Handling

All times are displayed in **Europe/London** timezone using `date-fns-tz`.

- Never use `new Date().toLocaleString()` without specifying `timeZone: "Europe/London"`
- Use `formatInTimeZone(date, "Europe/London", "HH:mm")` from `date-fns-tz`
- The `formatTime` and `relativeTime` helpers in `/lib/utils.ts` handle this correctly

---

## Shared Hooks & Utilities

### `usePlugin<T>` (`/lib/hooks/usePlugin.ts`)

Generic polling hook used by **all** widgets. Do not implement custom fetch logic in widgets.

```ts
const { data, loading, error, lastUpdated, refresh } = usePlugin<T[]>("/api/name", refreshMs)
```

### `/lib/utils.ts`

- `formatTime(iso)` → `"HH:mm"` in Europe/London
- `relativeTime(date)` → `"2h ago"`, `"just now"`
- `minutesUntil(iso)` → number of minutes until ISO datetime
- `hashToHue(str)` → deterministic HSL hue from string (for calendar colours)

---

## npm Scripts

```bash
npm run dev        # Development server (localhost:3000)
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint
```

---

## Key Files

| File | Purpose |
|------|---------|
| `/lib/config.ts` | All env var constants: station CRS, Huxley2 base/token, weather coords, timezone, and computed refresh intervals in ms |
| `/lib/plugin-types.ts` | `PluginConfig` interface |
| `/lib/plugins-registry.ts` | Central plugin registry |
| `/lib/hooks/usePlugin.ts` | Shared polling hook |
| `/lib/utils.ts` | Date/time/colour utilities |
| `/app/layout.tsx` | Root layout, Geist fonts |
| `/app/page.tsx` | Dashboard grid |
| `/components/Header.tsx` | Live clock header |
| `/components/WidgetCard.tsx` | Base card + CardHeader components |

---

## Documentation & Assets

- **`README.md`** — minimal, feature-focused. Keep it short. No API schemas, no project structure trees, no tech stack tables. Update it when widgets are added or removed.
- **`.env.example`** — the canonical reference for configuration. Every env var in `lib/config.ts` must have a corresponding commented entry here. Never put real keys in this file.
- **`public/dashboard.png`** — screenshot of the full dashboard. Replace it when the UI changes significantly.

---

## Known Gotchas

- **`webcal://` protocol** — iCloud and some other calendar providers give URLs beginning with `webcal://`. Node.js `fetch()` only supports `http://` and `https://`. The calendar API route rewrites the scheme before fetching.

- **postcodes.io outward codes return arrays** — When `WEATHER_POSTCODE` is an outward code (e.g. `SW1A`) rather than a full postcode, `api.postcodes.io/outcodes/{outcode}` returns `admin_district` as an array of boroughs. The weather API takes the first element. Full postcodes return a plain string.

- **Huxley2 `minutesUntil` for delayed trains** — The `etd` field from Huxley2 is a plain `"HH:mm"` string when the train has a new estimated time. The trains API uses `etd` (not `std`) to compute `minutesUntil` when a train is delayed, otherwise time-of-day arithmetic wraps past midnight and produces spurious values like "in 1420 mins".

- **Huxley2 station name** — The trains API returns `{ stationName, departures }` (a `TrainsResponse` envelope). `stationName` is read from `json.locationName` in the Huxley2 response and falls back to the raw `STATION_CRS` code. The widget header displays the full name dynamically.

- **iCal recurring events** — The calendar API uses `ICAL.RecurExpansion` to expand recurring events for today. Iteration is capped at 500 occurrences per event to prevent runaway loops on rules with no UNTIL/COUNT bound.

- **TfL vs Huxley2** — These are separate APIs for separate networks. TfL (`TFL_API_KEY`) provides London Underground line status. Huxley2 (`HUXLEY2_TOKEN`) proxies National Rail Darwin data for mainline rail departures. Do not conflate them.

- **Server-side caching** — External fetches use `next: { revalidate: N }` to cache at the Next.js layer. Widgets also poll on a client-side interval (`REFRESH_*_MINUTES`). The two are independent; the server cache prevents hammering upstream APIs when multiple browser clients are connected.

- **Mock data on missing keys** — Every widget falls back to hardcoded mock data when `data` from `usePlugin` is `null` (i.e. the API call hasn't succeeded yet or the key isn't configured). A footer note in each widget indicates when mock data is being shown.

- **Weather day/night icons** — `getWeatherInfo(code, hourLocal)` in `plugins/weather/weather-codes.ts` accepts an optional local hour (0–23). Hours 0–6 and 20–23 are treated as night: clear sky returns `Moon`, mainly/partly cloudy returns `CloudMoon`. All precipitation and cloud codes are identical day and night. Always pass the local hour from `formatInTimeZone(..., "H")` when calling this function.

- **Weather `probOfPrecipitation`** — The Met Office hourly endpoint provides `probOfPrecipitation` (0–100 %). It is fetched in the weather API route and stored in `WeatherHour`. The hourly strip always shows this percentage; `precipitationRate` (mm/hr) is still fetched but no longer displayed separately.
