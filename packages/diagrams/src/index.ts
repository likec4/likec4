export * from './diagram'
export * from './components'
export * from './hooks/useViewIdFromHash'

export { LikeC4 } from './likec4'

// Re-export types
export type {
  Fqn,
  Element,
  RelationID,
  Relation,
  NodeId,
  EdgeId,
  ViewID,
  ComputedView,
  LikeC4Theme,
  DiagramNode,
  DiagramEdge,
  DiagramLabel,
  DiagramView
} from '@likec4/core'
