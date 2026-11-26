import type { LayoutedLikeC4ModelData } from '@likec4/core/types'
import type {
  ColorScheme,
  HostData,
  HostOptions,
  HostState,
  ModelData,
} from '@likec4/vscode-preview/markdown-protocol'
import type { ProjectResolution, ResolvedProject, UriLocation } from './resolveProject.ts'

export type { HostData, HostOptions, HostState, ModelData }

/** Cached, layouted model snapshot of one project. */
export interface ProjectSnapshot {
  /** Content hash of the model payload (changes iff the layouted model changed). */
  readonly hash: string
  /** ok: current; stale: project has errors and data is the last good model; error: no usable data. */
  readonly state: 'ok' | 'stale' | 'error'
  readonly message?: string | undefined
  readonly viewIds: ReadonlySet<string>
  readonly data?: LayoutedLikeC4ModelData | undefined
  /** Pre-serialized and script-escaped JSON of `data`. */
  readonly modelJson?: string | undefined
  /** UTF-8 byte length of `modelJson`. */
  readonly modelBytes?: number | undefined
}

export interface RenderDeps {
  enabled(): boolean
  maxModelBytes(): number
  maxHeight(): number
  colorScheme(): ColorScheme
  panZoom(): boolean
  resolve(docDir: UriLocation | undefined, explicit: string | undefined): ProjectResolution | 'pending'
  snapshot(project: ResolvedProject): ProjectSnapshot | undefined
  recordReferences(docKey: string, projects: ReadonlyArray<ResolvedProject>): void
  markPendingDiscovery?(docKey: string): void
  renderHostBody?(
    snap: ProjectSnapshot,
    viewId: string,
    opts: HostOptions,
    hostId: string,
    data: HostData,
  ): string
  onRendered?(docKey: string | undefined, blocks: number, ms: number): void
}
