import type { PluginConfig } from "@/lib/plugin-types"
import { REFRESH_WEATHER_MS } from "@/lib/config"

const config: PluginConfig = {
  id: "weather",
  label: "Weather",
  refreshMs: REFRESH_WEATHER_MS,
  colSpan: 6,
  enabled: true,
}

export default config
