import { NextResponse } from "next/server"
import type { TubeLineStatus } from "../types"

/**
 * Status descriptions that are considered disruptions.
 * "Good Service" is the only non-disrupted state; everything else sets `isDisrupted: true`.
 */
const DISRUPTED_STATUSES = new Set([
  "Minor Delays",
  "Severe Delays",
  "Part Suspended",
  "Suspended",
  "Part Closure",
  "Planned Closure",
  "Service Closed",
  "Bus Service",
  "No Step Free Access",
])

/** `GET /api/tube` — returns status for all London Underground lines. Server cache: 120 s. */
export async function GET() {
  const apiKey = process.env.TFL_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "TFL_API_KEY not configured" },
      { status: 500 }
    )
  }

  try {
    const url = `https://api.tfl.gov.uk/Line/Mode/tube/Status?app_key=${apiKey}`
    const res = await fetch(url, { next: { revalidate: 120 } })
    if (!res.ok) throw new Error(`TfL API returned ${res.status}`)

    const json = await res.json()

    const lines: TubeLineStatus[] = json.map((line: {
      id: string
      name: string
      lineStatuses?: Array<{ statusSeverityDescription: string }>
    }) => {
      const status = line.lineStatuses?.[0]?.statusSeverityDescription ?? "Unknown"
      return {
        id: line.id,
        name: line.name,
        status,
        isDisrupted: DISRUPTED_STATUSES.has(status),
      }
    })

    return NextResponse.json(lines)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch tube status" },
      { status: 500 }
    )
  }
}
