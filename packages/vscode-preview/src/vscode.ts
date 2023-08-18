import type { DiagramView, Fqn, RelationID, ViewID } from '@likec4/core'
import type { PanelToExtensionProtocol } from '../protocol'

const vscode = acquireVsCodeApi<{
  view: DiagramView
}>()

const queueMicrotask = (cb: () => void) => void Promise.resolve().then(cb)

const sendToExtension = (msg: PanelToExtensionProtocol) => {
  queueMicrotask(() => {
    vscode.postMessage(msg)
  })
}

export const getPreviewWindowState = () => {
  return vscode.getState()?.view ?? null
}

export const savePreviewWindowState = (view: DiagramView) => {
  vscode.setState({
    view
  })
}

export const closePreviewWindow = () => {
  sendToExtension({
    kind: 'close'
  })
}

export const imReady = () => {
  sendToExtension({
    kind: 'ready'
  })
}

export const openView = (viewId: ViewID) => {
  sendToExtension({
    kind: 'open',
    viewId
  })
}

export const goToElement = (element: Fqn) => {
  sendToExtension({
    kind: 'goToElementSource',
    element
  })
}

export const goToRelation = (relationId: RelationID) => {
  sendToExtension({
    kind: 'goToRelationSource',
    relationId
  })
}

export const goToViewSource = (viewId: ViewID) => {
  sendToExtension({
    kind: 'goToViewSource',
    viewId
  })
}
