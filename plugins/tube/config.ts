import type { PluginConfig } from "@/lib/plugin-types"
import { REFRESH_TUBE_MS } from "@/lib/config"

const config: PluginConfig = {
  id: "tube",
  label: "Tube Status",
  refreshMs: REFRESH_TUBE_MS,
  colSpan: 4,
  enabled: true,
}

export default config
