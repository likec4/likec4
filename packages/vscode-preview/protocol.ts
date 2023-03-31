import type { DiagramView, ViewID, NodeId, EdgeId } from '@likec4/core/types'

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
    kind: 'onNodeClick'
    viewId: ViewID
    nodeId: NodeId
  } | {
    kind: 'onEdgeClick'
    viewId: ViewID
    edgeId: EdgeId
  }
