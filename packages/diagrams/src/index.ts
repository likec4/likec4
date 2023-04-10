export type {
  Fqn,
  Element,
  RelationID,
  Relation,
  DiagramNode,
  NodeId,
  DiagramEdge,
  EdgeId,
  ViewID,
  DiagramView
} from '@likec4/core/types'

export { Diagram, DefaultDiagramTheme } from './diagram'
export type * from './diagram'

export { EmbeddedDiagram } from './embedded/EmbeddedDiagram'
export type * from './embedded/EmbeddedDiagram'
