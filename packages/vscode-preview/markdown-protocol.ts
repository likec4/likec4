export type ColorScheme = 'auto' | 'light' | 'dark'
export type DynamicVariant = 'diagram' | 'sequence'
export type HostState = 'ok' | 'loading' | 'error' | 'stale'

/** JSON payload inside each `<div class="likec4-view">` host's `<script type="application/json">`. */
export interface HostData {
  readonly hash: string
  readonly state: HostState
  readonly message?: string | undefined
  readonly trimmed?: boolean | undefined
}

/** JSON payload inside the shared per-project `<div class="likec4-model">` element. */
export interface ModelData {
  readonly hash: string
  readonly trimmed: boolean
  readonly model: unknown
}

/** Stable render options stored in `data-likec4-opts` (preserved across data-only refreshes). */
export interface HostOptions {
  readonly project: string
  readonly viewId: string
  readonly model: string
  readonly browser: boolean
  readonly variant: DynamicVariant
  readonly scheme: ColorScheme
  readonly maxHeight: number
  readonly panZoom: boolean
}
