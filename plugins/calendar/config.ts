import type { PluginConfig } from "@/lib/plugin-types"
import { REFRESH_CALENDAR_MS } from "@/lib/config"

const config: PluginConfig = {
  id: "calendar",
  label: "Calendar",
  refreshMs: REFRESH_CALENDAR_MS,
  colSpan: 6,
  enabled: true,
}

export default config
