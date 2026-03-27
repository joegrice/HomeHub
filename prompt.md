Build a minimal, modular personal home dashboard as a single-page Next.js 15 (App Router) application using TypeScript. The visual design should closely follow the aesthetic of flighty.com/airports — dark background (#0a0a0f), card-based layout, clean data density, subtle borders, status colour coding (green/amber/red), and a strong typographic hierarchy. Use shadcn/ui components (Card, Badge, Separator, Skeleton) and Tailwind CSS throughout. Use the Geist font family (Geist Sans + Geist Mono for time/code values).

---

## Layout

A full-viewport dark dashboard with:
- A slim top header bar: site title ("Dashboard"), current date/time (live ticking, Geist Mono), and a small location tag (CHE / Birmingham)
- A responsive CSS grid below: 12-column on desktop, collapsing gracefully to 2-col tablet and 1-col mobile
- Each widget is a Card with a labelled header (small uppercase tracking-widest label + optional status dot), a clean data body, and subtle hover states

---

## Widgets

### 1. Next Trains — CHE (Chelmsford)
- Calls the TfL Rail API: `https://api.tfl.gov.uk/StopPoint/{naptanId}/Arrivals`
- CHE (Chelmsford) NaPTAN ID: `910GCHELMSD`
- Requires a TfL API key passed as `?app_key=` query param, stored in `process.env.TFL_API_KEY`
- Filter results to `modeName: "elizabeth-line"` or `"national-rail"` as appropriate
- Sort by `timeToStation` ascending, show next 5 departures
- Each row: scheduled departure time (Geist Mono, large), destination (`towards`), minutes until departure as a live countdown badge, line name, and status (On Time = green, Delayed = amber with revised time, Cancelled = red)
- Poll every 30 seconds with a subtle animated refresh indicator in the card header
- A "Last updated Xm ago" footer
- Occupies 2 columns

### 2. London Tube Status
- Calls the TfL Unified API: `https://api.tfl.gov.uk/Line/Mode/tube/Status`
- Same TfL API key (`process.env.TFL_API_KEY`) applied to all TfL requests
- Shows all lines in a compact grid (2 columns within the card)
- Each line: coloured dot matching the official TfL line colour, line name, status text (Good Service / Minor Delays / Severe Delays / Part Suspended / Suspended)
- Colour-code the status text: green for Good Service, amber for Minor Delays, red for Severe/Suspended
- Show a single "All lines good service" summary pill when everything is green, otherwise expand to show only disrupted lines prominently with a full list collapsed below
- Occupies 2 columns

### 3. Weather — Met Office DataHub (Hourly Breakdown)
- Use the Met Office DataHub API (Site-specific hourly forecast):
  `https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/hourly`
- Query params: `latitude=52.4796&longitude=-1.9026&includeLocationName=true`
- Auth: pass `apikey` header from `process.env.METOFFICE_API_KEY`
- Parse the GeoJSON response: `features[0].properties.timeSeries[]` contains hourly slots
- Each slot has: `time`, `screenTemperature`, `feelsLikeTemperature`, `precipitationRate`, `windSpeed10m`, `windDirectionFrom10m`, `weatherCode` (WMO standard)
- Map `weatherCode` to a human label and a Lucide icon (e.g. 0 = Clear/Sun, 1-3 = Cloudy, 45/48 = Fog, 51-67 = Rain, 71-77 = Snow, 80-82 = Showers, 95 = Thunderstorm)
- Hero section: current hour — large temperature, feels like, condition label + icon, wind speed/direction
- Below: horizontally scrollable hourly strip for next 12 hours — each slot: time (HH:mm), icon, temp °C, precip chance
- Occupies 3 columns

### 4. Today's Calendar Events
- Support two source options, configured via `process.env.CALENDAR_SOURCE` = `"ical"` or `"gmail"`:

  **Option A — iCal/CalDAV (default, recommended)**
  - Fetch an `.ics` URL from `process.env.ICAL_URL` (supports iCloud, Outlook, Google Calendar public/private iCal links)
  - Parse server-side using the `ical.js` npm package
  - Filter to events occurring today (in Europe/London timezone)
  - Handle recurring events (RRULE expansion via ical.js's `ICAL.RecurExpansion`)

  **Option B — Gmail/Google Calendar API**
  - Use the Google Calendar API: `https://www.googleapis.com/calendar/v3/calendars/primary/events`
  - Auth via a service account JSON key (`process.env.GOOGLE_SERVICE_ACCOUNT_KEY`) using the `googleapis` npm package
  - Query `timeMin` = start of today, `timeMax` = end of today, `singleEvents=true`, `orderBy=startTime`

- Display: chronological list of today's events
- Each event row: start time (Geist Mono), duration pill, event title (semibold), location if present (muted, with a MapPin icon)
- Colour-code by calendar if multiple calendars present (derive a consistent hue from the calendar name using a hash)
- Show an "All clear — nothing scheduled today" empty state with a subtle check icon
- Current/in-progress events highlighted with a left accent border in green
- Upcoming events within 30 mins shown with an amber "Soon" badge
- Poll / revalidate every 5 minutes
- Occupies 3 columns

### 5. BBC News — Top 5 Stories
- Fetch the BBC News RSS feed: `https://feeds.bbci.co.uk/news/rss.xml`
- Parse via a Next.js Route Handler (`/api/news`) using the `rss-parser` npm package (handles CORS server-side)
- Display top 5 stories: headline (semibold, truncated to 2 lines), source tag "BBC News", published relative time ("2h ago")
- Each story is a clickable row (opens in new tab) with a subtle right-arrow chevron
- No images needed — text-only, clean list
- Occupies 2 columns

---

## API / Data Layer

- All external API calls go through Next.js Route Handlers (`/app/api/*/route.ts`) to avoid CORS and keep keys server-side
- Use `next: { revalidate: 60 }` on fetches where appropriate; client-side widgets use `setInterval` polling
- All API keys stored in `.env.local`, never exposed to the client
- Each widget fetches independently — a failure in one must not break others; show a shadcn Alert error state per widget with a retry button
- Use React Suspense + shadcn Skeleton as loading states for each card

### Environment Variables
```env
TFL_API_KEY=                  # TfL Unified API key (free registration at api.tfl.gov.uk)
METOFFICE_API_KEY=            # Met Office DataHub key (free tier at datahub.metoffice.gov.uk)
CALENDAR_SOURCE=ical          # "ical" or "gmail"
ICAL_URL=                     # Your private iCal/CalDAV URL
GOOGLE_SERVICE_ACCOUNT_KEY=   # JSON string of GCP service account (if CALENDAR_SOURCE=gmail)
```

---

## Design Details

- Colour palette: background `#0a0a0f`, card `#111118`, border `#1e1e2e`, muted `#6b7280`, accent blue `#3b82f6`
- Status: success `#22c55e`, warning `#f59e0b`, danger `#ef4444`
- All times in `en-GB` locale, 24-hour, Europe/London timezone (use `date-fns-tz` for all timezone handling)
- Cards: `rounded-xl border border-[#1e1e2e] p-5 shadow-lg`
- Card headers: `text-xs uppercase tracking-widest text-muted-foreground` with a live pulse dot on real-time widgets
- Use `framer-motion` for staggered card entrance on load (fade + translate-y, short delay per card)
- Train and tube widgets show a subtle spinner in the header while re-fetching

---

## File Structure
/app
/api
/trains/route.ts       ← TfL arrivals for 910GCHELMSD
/tube/route.ts         ← TfL tube line status
/weather/route.ts      ← Met Office DataHub hourly
/calendar/route.ts     ← iCal or Google Calendar events
/news/route.ts         ← BBC RSS
/page.tsx
/layout.tsx
/components
/widgets
TrainWidget.tsx
TubeWidget.tsx
WeatherWidget.tsx
CalendarWidget.tsx
NewsWidget.tsx
/ui                      ← shadcn components
/lib
/config.ts
/utils.ts
/weather-codes.ts        ← WMO code → label + Lucide icon map
/tfl-line-colours.ts     ← official hex per line

---

## Key Config (lib/config.ts)
```ts
export const STATION_NAPTAN   = '910GCHELMSD';   // Chelmsford
export const WEATHER_LAT      = 52.4796;
export const WEATHER_LNG      = -1.9026;
export const TIMEZONE         = 'Europe/London';
export const REFRESH_TRAINS_MS   = 30_000;
export const REFRESH_TUBE_MS     = 120_000;
export const REFRESH_WEATHER_MS  = 900_000;
export const REFRESH_CALENDAR_MS = 300_000;
export const REFRESH_NEWS_MS     = 300_000;
```

---

## Build Order (recommended for Claude Code)

1. Scaffold layout + all five cards with static mock data — nail the visual design first
2. Wire `/api/tube` → TubeWidget (simplest, no key needed if omitted)
3. Wire `/api/trains` → TrainWidget (TfL key required)
4. Wire `/api/weather` → WeatherWidget (Met Office key required)
5. Wire `/api/calendar` → CalendarWidget (iCal path first, Gmail optional)
6. Wire `/api/news` → NewsWidget (no key, just RSS parse)
7. Add Framer Motion entrance animations last

Notes worth knowing before you start
TfL for Chelmsford trains — Chelmsford is served by Greater Anglia, not TfL directly. The TfL arrivals endpoint (/StopPoint/{id}/Arrivals) covers Elizabeth line and some Overground stops but won't return Greater Anglia departures. You have two options:

Keep TfL if you want Elizabeth line from a London stop (e.g. Stratford → Liverpool Street leg), swap 910GCHELMSD for a TfL-served stop
Use Transport API or Huxley2 for actual Chelmsford (CHE) National Rail departures — Huxley2 (https://huxley2.azurewebsites.net/departures/CHE/5) is free with no key and wraps National Rail perfectly

I'd suggest telling Claude Code upfront: "Use Huxley2 for trains, not the TfL arrivals endpoint, as CHE is Greater Anglia not TfL" and adjusting the env vars accordingly. Want me to revise that section of the prompt to use Huxley2 instead?this will be called homehub, ensure plugins are used where needed too, give me one output prompt for claude code15:38Here's your single, complete Claude Code prompt:

# HomeHub — Personal Home Dashboard

Build a minimal, modular personal home dashboard called **HomeHub** as a single-page Next.js 15 (App Router) application using TypeScript.

---

## Visual Design

Follow the aesthetic of flighty.com/airports closely:
- Dark background (#0a0a0f), card background (#111118), border (#1e1e2e)
- Clean data density, strong typographic hierarchy, status colour coding
- Card style: `rounded-xl border border-[#1e1e2e] p-5 shadow-lg bg-[#111118]`
- Card headers: `text-xs uppercase tracking-widest text-muted-foreground` with a live pulse dot on real-time widgets
- Status colours: success `#22c55e`, warning `#f59e0b`, danger `#ef4444`, accent `#3b82f6`
- Font: Geist Sans for UI, Geist Mono for all times, countdowns, and numeric values
- All times in `en-GB` locale, 24-hour format, `Europe/London` timezone via `date-fns-tz`
- Use shadcn/ui components throughout: Card, Badge, Separator, Skeleton, Alert, Button
- Use `framer-motion` for staggered card entrance on load (fade + translateY, incremental delay per card)

---

## Layout

- Slim top header bar: "HomeHub" wordmark (left), live ticking clock in Geist Mono (centre), date + location tag "CHE · Birmingham" (right)
- Responsive 12-column CSS grid below the header
- Widgets collapse gracefully: 12-col desktop → 2-col tablet → 1-col mobile
- Each widget is fully self-contained and fetches independently — one widget failing must never affect others

---

## Plugin Architecture

Structure the codebase so each widget is a **plugin** — a self-contained unit with:
/plugins
/trains
config.ts          ← plugin metadata + refresh interval
api/route.ts       ← Next.js Route Handler (server-side fetch)
TrainWidget.tsx    ← client component
types.ts
/tube
config.ts
api/route.ts
TubeWidget.tsx
types.ts
/weather
config.ts
api/route.ts
WeatherWidget.tsx
types.ts
weather-codes.ts
/calendar
config.ts
api/route.ts
CalendarWidget.tsx
types.ts
/news
config.ts
api/route.ts
NewsWidget.tsx
types.ts

Each plugin's `config.ts` exports a standard `PluginConfig` interface:
```ts
export interface PluginConfig {
  id: string;
  label: string;
  refreshMs: number;
  colSpan: number; // grid column span
  enabled: boolean;
}
```

The dashboard `page.tsx` imports each plugin's config and widget dynamically. Adding a new plugin in future should require only: creating a new plugin folder and registering it in `/lib/plugins-registry.ts`.
```ts
// lib/plugins-registry.ts
import trainsConfig from '@/plugins/trains/config';
import tubeConfig from '@/plugins/tube/config';
import weatherConfig from '@/plugins/weather/config';
import calendarConfig from '@/plugins/calendar/config';
import newsConfig from '@/plugins/news/config';

export const PLUGINS = [
  trainsConfig,
  tubeConfig,
  weatherConfig,
  calendarConfig,
  newsConfig,
];
```

---

## Widgets / Plugins

### Plugin 1 — Trains (colSpan: 4)

**Data source: Huxley2** (free National Rail proxy, no API key required)
- Departures: `https://huxley2.azurewebsites.net/departures/CHE/10`
- This returns Greater Anglia departures from Chelmsford (CHE) — do NOT use the TfL arrivals endpoint as CHE is not a TfL-served stop

**Route Handler:** `/plugins/trains/api/route.ts`
- Fetch Huxley2, normalise to `TrainDeparture[]`, return JSON
- Revalidate every 30 seconds

**Widget display:**
- Next 5 departures in a table-style list
- Each row: `std` scheduled time (Geist Mono, large), `destination.locationName`, platform badge, operator name (muted), status badge:
  - "On time" → green
  - "Delayed" → amber, show `etd` as revised time
  - "Cancelled" → red strikethrough
- Live countdown in minutes alongside scheduled time ("in 4m")
- Animated refresh indicator in card header while fetching
- "Updated Xs ago" footer
- Error state: shadcn Alert with retry button

**Types:**
```ts
interface TrainDeparture {
  scheduledTime: string;   // "HH:mm"
  destination: string;
  platform: string | null;
  operator: string;
  status: 'on-time' | 'delayed' | 'cancelled';
  revisedTime: string | null;
  minutesUntil: number;
}
```

---

### Plugin 2 — Tube Status (colSpan: 4)

**Data source: TfL Unified API**
- Endpoint: `https://api.tfl.gov.uk/Line/Mode/tube/Status?app_key=${TFL_API_KEY}`
- `process.env.TFL_API_KEY` (free registration at api.tfl.gov.uk)

**Route Handler:** `/plugins/tube/api/route.ts`
- Fetch all tube lines, map to `TubeLineStatus[]`, return JSON
- Revalidate every 120 seconds

**Widget display:**
- If all lines are "Good Service": show a single green pill "All lines good service" + compact collapsed list
- If disruptions exist: show disrupted lines prominently at top (with amber/red status), then collapsed "X lines good service" summary below
- Each line row: official TfL line colour dot, line name, status text, severity badge
- Official TfL line hex colours defined in `/plugins/tube/tfl-colours.ts`

**TfL line colours:**
```ts
export const TFL_LINE_COLOURS: Record<string, string> = {
  bakerloo: '#B36305', central: '#E32017', circle: '#FFD300',
  district: '#00782A', 'hammersmith-city': '#F3A9BB', jubilee: '#A0A5A9',
  metropolitan: '#9B0056', northern: '#000000', piccadilly: '#003688',
  victoria: '#0098D4', 'waterloo-city': '#95CDBA',
  'elizabeth': '#6950a1', overground: '#EE7C0E',
};
```

---

### Plugin 3 — Weather (colSpan: 6)

**Data source: Met Office DataHub — Site-specific Hourly Forecast**
- Endpoint: `https://data.hub.api.metoffice.gov.uk/sitespecific/v0/point/hourly?latitude=52.4796&longitude=-1.9026&includeLocationName=true`
- Auth header: `apikey: process.env.METOFFICE_API_KEY`
- Free tier available at: datahub.metoffice.gov.uk

**Route Handler:** `/plugins/weather/api/route.ts`
- Parse GeoJSON response: `features[0].properties.timeSeries[]`
- Each slot contains: `time`, `screenTemperature`, `feelsLikeTemperature`, `precipitationRate`, `windSpeed10m`, `windDirectionFrom10m`, `screenRelativeHumidity`, `weatherCode` (WMO)
- Normalise to `WeatherHour[]`, return JSON
- Revalidate every 15 minutes

**WMO code mapping** (`/plugins/weather/weather-codes.ts`):
```ts
// Map WMO weatherCode → { label: string, icon: LucideIcon }
// 0: Sun, 1-3: Cloud variants, 45/48: Fog, 51-67: Rain variants,
// 71-77: Snow, 80-82: Showers, 95: Thunderstorm, etc.
```

**Widget display:**
- **Hero row:** current hour — large temperature (Geist Mono), feels like, condition icon + label, wind speed + direction arrow, humidity
- **Hourly strip:** horizontally scrollable, next 12 hours — each slot: time (HH:mm Geist Mono), Lucide weather icon, temp °C, precipitation rate indicator
- Current hour slot highlighted with accent border

---

### Plugin 4 — Calendar (colSpan: 6)

**Data source:** iCal URL (primary) or Google Calendar API (optional)

Configured via `process.env.CALENDAR_SOURCE`:
- `"ical"` (default): fetches `process.env.ICAL_URL` — supports iCloud, Outlook, Google Calendar private iCal links
- `"gmail"`: uses Google Calendar API with service account

**Route Handler:** `/plugins/calendar/api/route.ts`

**iCal path:**
- Fetch `.ics` from `ICAL_URL` server-side
- Parse with `ical.js` npm package
- Expand recurring events using `ICAL.RecurExpansion`
- Filter to events occurring today in `Europe/London` timezone
- Return `CalendarEvent[]` sorted by start time

**Gmail/Google Calendar path:**
- Use `googleapis` npm package
- Auth via `process.env.GOOGLE_SERVICE_ACCOUNT_KEY` (JSON string of service account)
- Query: `timeMin` = today 00:00, `timeMax` = today 23:59, `singleEvents=true`, `orderBy=startTime`
- Return same `CalendarEvent[]` shape

**Widget display:**
- Chronological list of today's events
- Each row: start time (Geist Mono), duration pill (e.g. "1h 30m"), event title (semibold), location (muted, MapPin icon if present)
- **In-progress events** (now between start and end): left accent border in green + "Now" badge
- **Events within 30 mins**: amber "Soon" badge
- **Past events**: muted/dimmed
- Calendar colour dot derived from calendar name (consistent hash → hue)
- Empty state: subtle check icon + "Nothing scheduled today"
- Revalidate every 5 minutes

**Types:**
```ts
interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;   // ISO
  endTime: string;     // ISO
  location?: string;
  calendarName?: string;
  isAllDay: boolean;
}
```

---

### Plugin 5 — News (colSpan: 4)

**Data source: BBC News RSS**
- Endpoint: `https://feeds.bbci.co.uk/news/rss.xml`
- Parsed server-side using `rss-parser` npm package

**Route Handler:** `/plugins/news/api/route.ts`
- Fetch + parse RSS, return top 5 items as `NewsItem[]`
- Revalidate every 5 minutes

**Widget display:**
- Top 5 stories: headline (semibold, 2-line clamp), "BBC News" source tag, relative published time ("2h ago")
- Each row is a full clickable anchor (opens new tab) with a ChevronRight icon on the right
- Subtle hover state: slight background lift
- No images — text only

---

## Shared Infrastructure

### `/lib/plugins-registry.ts`
Central registry — imports all plugin configs. Dashboard renders widgets from this list dynamically.

### `/lib/config.ts`
```ts
export const STATION_CRS      = 'CHE';
export const HUXLEY2_BASE     = 'https://huxley2.azurewebsites.net';
export const WEATHER_LAT      = 52.4796;
export const WEATHER_LNG      = -1.9026;
export const TIMEZONE         = 'Europe/London';
```

### `/lib/hooks/usePlugin.ts`
Shared client hook for polling:
```ts
// usePlugin<T>(apiPath: string, refreshMs: number): { data: T | null, loading: boolean, error: string | null, lastUpdated: Date | null }
// Handles setInterval polling, error state, and loading state
// Exposes a manual refresh trigger
```

All widgets use `usePlugin` — no widget should implement its own fetch logic.

### `/lib/utils.ts`
- `formatTime(iso: string): string` — HH:mm in Europe/London
- `relativeTime(iso: string): string` — "2h ago", "just now"
- `minutesUntil(iso: string): number`
- `hashToHue(str: string): string` — deterministic hue from string for calendar colours

---

## Environment Variables (`/.env.local`)
```env
# TfL (free — https://api.tfl.gov.uk)
TFL_API_KEY=

# Met Office DataHub (free tier — https://datahub.metoffice.gov.uk)
METOFFICE_API_KEY=

# Calendar — choose one source
CALENDAR_SOURCE=ical
ICAL_URL=                        # Private iCal/CalDAV URL (iCloud, Outlook, Google)

# Only required if CALENDAR_SOURCE=gmail
GOOGLE_SERVICE_ACCOUNT_KEY=      # Full JSON of GCP service account, as a single-line string
```

---

## `CLAUDE.md` (project root)

Generate a `CLAUDE.md` at the project root with:
- Project overview and purpose
- Plugin architecture explanation and how to add a new plugin
- Environment variable reference with descriptions
- API sources used (Huxley2, TfL, Met Office DataHub, iCal/Google Calendar, BBC RSS)
- Data flow diagram (text-based)
- npm scripts reference
- Notes on timezone handling and the `date-fns-tz` requirement

---

## Build Order

Execute in this sequence — do not proceed to the next step until the current one is complete and visually confirmed:

1. **Scaffold** — Init Next.js 15 project, install all dependencies, configure Tailwind + shadcn/ui + Geist fonts, set up `/lib/config.ts` and `/lib/plugins-registry.ts`
2. **Layout + shell** — Header bar with live clock, responsive 12-col grid, plugin slot placeholders
3. **Static mocks** — Build all 5 widgets with realistic hardcoded mock data. Nail the visual design and Framer Motion entrance animations before any live data
4. **`usePlugin` hook** — Implement shared polling hook used by all widgets
5. **Trains plugin** — Route handler (Huxley2) + wire TrainWidget
6. **Tube plugin** — Route handler (TfL) + wire TubeWidget
7. **Weather plugin** — Route handler (Met Office DataHub) + wire WeatherWidget + WMO code map
8. **Calendar plugin** — Route handler (iCal path first, Gmail path second) + wire CalendarWidget
9. **News plugin** — Route handler (BBC RSS) + wire NewsWidget
10. **Polish** — Error states, retry buttons, loading skeletons, "updated X ago" footers, refresh indicators, CLAUDE.md

---

## Dependencies
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "framer-motion": "^11.0.0",
    "date-fns": "^3.0.0",
    "date-fns-tz": "^3.0.0",
    "ical.js": "^1.5.0",
    "rss-parser": "^3.13.0",
    "googleapis": "^140.0.0",
    "lucide-react": "^0.400.0"
  }
}
```

shadcn/ui components to install: `card`, `badge`, `separator`, `skeleton`, `alert`, `button`
