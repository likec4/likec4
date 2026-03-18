import type { EdgeId, NodeId, NonEmptyArray, NonEmptyReadonlyArray } from '@likec4/core/types'

// /**
//  * Graph-level layout hints
//  */
// export interface AIGraphHint {
//   /** Override auto-layout direction */
//   direction?: 'TB' | 'BT' | 'LR' | 'RL'
//   /** Override node separation in pixels */
//   nodeSep?: number
//   /** Override rank separation in pixels */
//   rankSep?: number
// }

// /**
//  * Rank group constraint produced by AI analysis.
//  * Mirrors ComputedRankConstraint from core types.
//  */
// export interface AIRankConstraint {
//   /** Graphviz rank type */
//   type: 'same' | 'min' | 'max' | 'source' | 'sink'
//   /** Node IDs that should share this rank */
//   nodes: NodeId[]
// }

// /**
//  * Per-node layout hint
//  */
// export interface AINodeHint {
//   id: NodeId
//   /** Group name — nodes with the same group are placed closer together */
//   group: string
// }

// export interface AISuggestedEdgeAttrs {
//   /** Higher weight = shorter/straighter edge */
//   weight?: number
//   /** Minimum length in ranks */
//   minlen?: number
//   /** Whether this edge constrains rank assignment */
//   constraint?: boolean
// }

// /**
//  * Per-edge layout hint
//  */
// export interface AIEdgeHint extends AISuggestedEdgeAttrs {
//   id: EdgeId
// }

// /**
//  * invisible edge added by AI to enforce better layout
//  */
// export interface AIEnforcementEdge extends AISuggestedEdgeAttrs {
//   source: NodeId
//   target: NodeId
// }

/**
 * Complete set of AI-generated layout hints.
 * This is the JSON schema the LLM must produce.
 */
export interface AiLayoutHints {
  direction?: 'TB' | 'BT' | 'LR' | 'RL'
  ranks: ReadonlyArray<{
    rank: 'same' | 'source' | 'sink'
    nodes: NonEmptyArray<NodeId>
  }>
  edgeWeight: Record<EdgeId, number>
  edgeMinlen: Record<EdgeId, number>
  excludeFromRanking?: ReadonlySet<EdgeId>
  edgeOrder?: NonEmptyReadonlyArray<EdgeId>
  nodeOrder?: NonEmptyReadonlyArray<NodeId>
  /** LLM reasoning for debugging/display */
  reasoning: string
}
