/** Response envelope returned by `GET /api/trains`. */
export interface TrainsResponse {
  stationName: string
  departures: TrainDeparture[]
}

/** A single train departure returned by `GET /api/trains`. */
export interface TrainDeparture {
  /** Scheduled departure time in `"HH:mm"` format. */
  scheduledTime: string
  /** Final destination station name. */
  destination: string
  /** Platform number/letter, or `null` if not yet allocated. */
  platform: string | null
  /** Operating company name (falls back to operator code if name unavailable). */
  operator: string
  /** Service running status. */
  status: "on-time" | "delayed" | "cancelled"
  /** Revised estimated departure time in `"HH:mm"` format. Only set when `status === "delayed"`. */
  revisedTime: string | null
  /** Minutes until departure. Uses `revisedTime` when the service is delayed. */
  minutesUntil: number
  /** Number of carriages, or `null` if not provided by the API. */
  carriages: number | null
}
