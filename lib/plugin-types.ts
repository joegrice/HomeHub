/**
 * Configuration metadata for a dashboard plugin (widget).
 * Each plugin exports a singleton of this type from its `config.ts`.
 */
export interface PluginConfig {
  /** Unique plugin identifier, e.g. `"trains"`. Used as the API path segment. */
  id: string
  /** Human-readable label shown in the widget header. */
  label: string
  /** Client-side polling interval in milliseconds. Read from `REFRESH_*_MINUTES` env vars via `/lib/config.ts`. */
  refreshMs: number
  /** Number of columns this widget occupies in the 12-column grid. */
  colSpan: number
  /** When false the plugin is registered but not rendered. */
  enabled: boolean
}
