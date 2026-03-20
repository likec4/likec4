/**
 * Minimal model shape required by the bridge. Satisfied by LikeC4Model (layouted).
 * Keeps the bridge decoupled from concrete model class.
 */

/** Element shape required by the bridge (id, kind, title, tags, getMetadata). */
export interface BridgeElementLike {
  id: string
  kind: string
  title: string
  tags: readonly string[]
  technology?: string | null
  getMetadata(): Record<string, unknown>
}

/** Relation shape required by the bridge (id, source, target, kind, title). */
export interface BridgeRelationLike {
  id: string
  source: { id: string }
  target: { id: string }
  kind: string | null
  title?: string | null
}

/** View shape required by the bridge (id only). */
export interface BridgeViewLike {
  id: string
}

/** Model input for toBridgeManifest / toLeanixInventoryDryRun */
export interface BridgeModelInput {
  projectId: string
  elements(): Iterable<BridgeElementLike>
  relationships(): Iterable<BridgeRelationLike>
  views(): Iterable<BridgeViewLike>
}
