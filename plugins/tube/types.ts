/**
 * Known TfL line status severity descriptions.
 * The `TubeLineStatus.status` field may also contain other values returned by the TfL API.
 */
export type TubeStatus =
  | "Good Service"
  | "Minor Delays"
  | "Severe Delays"
  | "Part Suspended"
  | "Suspended"
  | "Part Closure"
  | "Planned Closure"
  | "Service Closed"

/** Status of a single London Underground line, returned by `GET /api/tube`. */
export interface TubeLineStatus {
  /** TfL line identifier, e.g. `"jubilee"`, `"elizabeth"`, `"hammersmith-city"`. */
  id: string
  /** Display name, e.g. `"Jubilee"`, `"Elizabeth line"`. */
  name: string
  /** Human-readable status description from the TfL API, e.g. `"Good Service"`, `"Minor Delays"`. */
  status: string
  /** `true` for any status other than `"Good Service"` (includes delays, suspensions, closures). */
  isDisrupted: boolean
}
