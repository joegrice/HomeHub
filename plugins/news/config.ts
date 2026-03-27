import type { PluginConfig } from "@/lib/plugin-types"
import { REFRESH_NEWS_MS } from "@/lib/config"

const config: PluginConfig = {
  id: "news",
  label: "News",
  refreshMs: REFRESH_NEWS_MS,
  colSpan: 4,
  enabled: true,
}

export default config
