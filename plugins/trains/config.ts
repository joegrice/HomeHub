import type { PluginConfig } from "@/lib/plugin-types"
import { REFRESH_TRAINS_MS } from "@/lib/config"

const config: PluginConfig = {
  id: "trains",
  label: "Next Trains",
  refreshMs: REFRESH_TRAINS_MS,
  colSpan: 4,
  enabled: true,
}

export default config
