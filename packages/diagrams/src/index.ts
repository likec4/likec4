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

export type { DiagramProps, DiagramApi, DiagramPaddings } from './diagram/types'
export { Diagram } from './diagram/Diagram'

export type { ResponsiveDiagramProps } from './responsive'
export { ResponsiveDiagram } from './responsive'

export { EmbeddedDiagram, FlexDiagram } from './embedded'
export type * from './embedded'
