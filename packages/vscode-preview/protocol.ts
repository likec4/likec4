import type { DiagramView, Fqn, RelationID, ViewID } from '@likec4/core'

export type ExtensionToPanelProtocol =
  | {
      kind: 'update'
      view: DiagramView
    }
  | {
      kind: 'onContextMenuOpenSource'
    }

export type PanelToExtensionProtocol =
  | {
      kind: 'open'
      viewId: ViewID
    }
  | {
      kind: 'ready'
    }
  | {
      kind: 'close'
    }
  | {
      kind: 'goToElementSource'
      element: Fqn
    }
  | {
      kind: 'goToViewSource'
      viewId: ViewID
    }
  | {
      kind: 'goToRelationSource'
      relationId: RelationID
    }
