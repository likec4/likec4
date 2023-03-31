import type { DiagramView, ViewID, Fqn, RelationID } from '@likec4/core/types'

export type ExtensionToPanelProtocol =
  | {
    kind: 'update'
    view: DiagramView
  }


export type PanelToExtensionProtocol =
  | {
    kind: 'open'
    viewId: ViewID
  } | {
    kind: 'ready'
  } | {
    kind: 'close'
  } | {
    kind: 'goToSource'
    element: Fqn
  } | {
    kind: 'goToViewSource'
    viewId: ViewID
  } | {
    kind: 'goToRelation'
    relationId: RelationID
  }
