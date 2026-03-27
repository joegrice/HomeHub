# HomeHub

Personal home dashboard built with Next.js 15. Displays five live-data widgets on a dark-themed single-page app — trains, tube status, weather, calendar, and news — each backed by real UK APIs.

## Prerequisites

- Node.js 20+
- npm

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` and populate the required keys (see [Environment Variables](#environment-variables) below):
   ```bash
   touch .env.local
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev        # Development server with hot reload (localhost:3000)
npm run build      # Production build
npm run start      # Production server (requires build first)
npm run lint       # ESLint
```

## Environment Variables

All variables go in `.env.local`. Variables marked **No** for required will fall back to defaults.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STATION_CRS` | No | `CHE` | National Rail CRS code for the trains widget (e.g. `WAT`, `MAN`, `EUS`) |
| `HUXLEY2_TOKEN` | No | — | Huxley2 access token for higher rate limits — register free at huxley2.azurewebsites.net |
| `TFL_API_KEY` | Yes (tube) | — | TfL Unified API key — free at api.tfl.gov.uk |
| `METOFFICE_API_KEY` | Yes (weather) | — | Met Office DataHub key — free tier at datahub.metoffice.gov.uk |
| `WEATHER_POSTCODE` | No | — | UK postcode for weather location (outward code fine, e.g. `SM3`, `SW1A`). Takes priority over lat/lng |
| `WEATHER_LAT` | No | `52.4796` | Latitude fallback when no postcode is set |
| `WEATHER_LNG` | No | `-1.9026` | Longitude fallback when no postcode is set |
| `CALENDAR_SOURCE` | No | `ical` | Calendar backend: `ical` or `gmail` |
| `ICAL_URL` | If `ical` | — | Private iCal/CalDAV URL. `webcal://` is automatically rewritten to `https://` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | If `gmail` | — | Full GCP service account JSON as a single-line string |
| `REFRESH_TRAINS_MINUTES` | No | `0.5` | Trains widget poll interval in minutes (decimals allowed, e.g. `0.5` = 30 s) |
| `REFRESH_TUBE_MINUTES` | No | `2` | Tube widget poll interval in minutes |
| `REFRESH_WEATHER_MINUTES` | No | `15` | Weather widget poll interval in minutes |
| `REFRESH_CALENDAR_MINUTES` | No | `5` | Calendar widget poll interval in minutes |
| `REFRESH_NEWS_MINUTES` | No | `5` | News widget poll interval in minutes |

## Project Structure

```
home-hub/
├── app/
│   ├── api/{plugin}/route.ts   # Thin re-exports → plugins/{plugin}/api/route.ts
│   ├── layout.tsx              # Root layout (Geist fonts, metadata)
│   └── page.tsx                # Dashboard grid — imports and positions widgets
├── components/
│   ├── Header.tsx              # Sticky header with live clock and date
│   └── WidgetCard.tsx          # Base card shell + CardHeader used by all widgets
├── lib/
│   ├── config.ts               # All env var constants and computed refresh intervals
│   ├── hooks/usePlugin.ts      # Generic polling hook used by every widget
│   ├── plugin-types.ts         # PluginConfig interface
│   ├── plugins-registry.ts     # Central list of active plugins
│   └── utils.ts                # Shared date/time and colour utilities
└── plugins/
    └── {name}/
        ├── config.ts           # Plugin metadata (id, label, refreshMs, colSpan, enabled)
        ├── api/route.ts        # Server-side data fetch — API keys never leave here
        ├── {Name}Widget.tsx    # React client component — uses usePlugin hook
        └── types.ts            # TypeScript interfaces for this plugin's data shape
```

## API Endpoints

All endpoints are Next.js Route Handlers (`GET` only). No client-side authentication — API keys are server-side only. On failure every endpoint returns `{ error: string }` with HTTP 500.

### `GET /api/trains`

Next departures from the configured station (`STATION_CRS`). Backed by the Huxley2 National Rail Darwin proxy.

**Response** — `TrainDeparture[]` (up to 5 services):

```ts
interface TrainDeparture {
  scheduledTime: string           // "HH:mm"
  destination: string
  platform: string | null         // null when not yet allocated
  operator: string
  status: "on-time" | "delayed" | "cancelled"
  revisedTime: string | null      // "HH:mm" — only set when status is "delayed"
  minutesUntil: number            // uses revisedTime when delayed
}
```

### `GET /api/tube`

Status of all London Underground lines. Backed by the TfL Unified API. Server cache: 120 s.

**Response** — `TubeLineStatus[]`:

```ts
interface TubeLineStatus {
  id: string           // TfL line ID, e.g. "jubilee", "elizabeth"
  name: string         // Display name, e.g. "Jubilee", "Elizabeth line"
  status: string       // e.g. "Good Service", "Minor Delays", "Suspended"
  isDisrupted: boolean // true for anything other than "Good Service"
}
```

### `GET /api/weather`

Hourly forecast for the configured location. Postcode is resolved via postcodes.io (cached 24 h), then Met Office DataHub is queried (cached 15 min).

**Response** — `WeatherResponse`:

```ts
interface WeatherResponse {
  locationName: string   // Resolved district name or raw postcode
  hours: WeatherHour[]   // Chronological hourly slots
}

interface WeatherHour {
  time: string                    // ISO 8601 UTC
  screenTemperature: number       // °C
  feelsLikeTemperature: number    // °C
  precipitationRate: number       // mm/hr
  windSpeed10m: number            // mph
  windDirectionFrom10m: number    // degrees from north
  screenRelativeHumidity: number  // %
  weatherCode: number             // WMO weather interpretation code
}
```

### `GET /api/calendar`

Today's events from the configured calendar source. Server cache: 5 min.

**Response** — `CalendarEvent[]` sorted by start time:

```ts
interface CalendarEvent {
  id: string
  title: string
  startTime: string       // ISO 8601
  endTime: string         // ISO 8601
  location?: string
  calendarName?: string
  isAllDay: boolean
}
```

### `GET /api/news`

Latest BBC News headlines from the RSS feed. Server cache: 5 min.

**Response** — `NewsItem[]` (up to 5 items):

```ts
interface NewsItem {
  title: string
  link: string
  pubDate: string   // ISO 8601
  source: string    // Always "BBC News"
}
```

## Tech Stack

| Layer | Library | Version |
|-------|---------|---------|
| Framework | Next.js (App Router) | 15 |
| Runtime | React | 19 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 4 |
| Components | shadcn/ui | 4 |
| Animations | Framer Motion | 12 |
| Date handling | date-fns + date-fns-tz | 4 / 3 |
| iCal parsing | ical.js | 2 |
| RSS parsing | rss-parser | 3 |
| Google APIs | googleapis | 171 |
