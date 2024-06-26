import { type DiagramView, type Fqn, type RelationID, type ViewID } from '@likec4/core'
import { useEffect, useRef } from 'react'
import { HOST_EXTENSION, isMessage } from 'vscode-messenger-common'
import { Messenger } from 'vscode-messenger-webview'
import { ExtensionToPanel, WebviewToExtension } from '../protocol'

export const isEditorEnabled = __EDITOR_ENABLED === true || __EDITOR_ENABLED === 'true'

const vscode = acquireVsCodeApi<{
  view: DiagramView
}>()

class Likec4Messenger extends Messenger {
  override start() {
    const listener = (event: { data: unknown }) => {
      if (isMessage(event.data)) {
        this.processMessage(event.data).catch(err => this.log(String(err), 'error'))
      }
    }
    window.addEventListener('message', listener)
    return () => {
      this.handlerRegistry.clear()
      window.removeEventListener('message', listener)
    }
  }
}

const messenger = new Likec4Messenger(vscode)

type OnExtensionToPanel = {
  onDiagramUpdate: (view: DiagramView) => void
  onError: (error: string) => void
  onGetHoveredElement: () => Fqn | null
}

export const extensionApi = {
  openView: (viewId: ViewID) => {
    messenger.sendNotification(WebviewToExtension.openView, HOST_EXTENSION, { viewId })
  },
  imReady: () => {
    messenger.sendNotification(WebviewToExtension.imReady, HOST_EXTENSION)
  },
  closeMe: () => {
    messenger.sendNotification(WebviewToExtension.closeMe, HOST_EXTENSION)
  },
  locate: (params: WebviewToExtension.LocateParams) => {
    messenger.sendNotification(WebviewToExtension.locate, HOST_EXTENSION, params)
  },
  change: (viewId: ViewID, change: WebviewToExtension.ChangeCommand) => {
    messenger.sendNotification(WebviewToExtension.onChange, HOST_EXTENSION, { viewId, change })
  },

  goToElement: (element: Fqn) => {
    extensionApi.locate({ element })
  },

  goToRelation: (relation: RelationID) => {
    extensionApi.locate({ relation })
  },

  goToViewSource: (view: ViewID) => {
    extensionApi.locate({ view })
  }
}

export function useMessenger(callbacks: OnExtensionToPanel) {
  const isMounted = useRef(false)
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useEffect(() => {
    isMounted.current = true

    messenger.onNotification(ExtensionToPanel.diagramUpdate, ({ view }) => {
      isMounted.current && callbacksRef.current.onDiagramUpdate(view)
    })

    messenger.onNotification(ExtensionToPanel.error, ({ error }) => {
      isMounted.current && callbacksRef.current.onError(error)
    })

    messenger.onRequest(ExtensionToPanel.getHoveredElement, () => {
      return {
        elementId: isMounted.current ? callbacksRef.current.onGetHoveredElement() : null
      }
    })

    const stop = messenger.start()
    return () => {
      isMounted.current = false
      stop()
    }
  }, [])

  return extensionApi
}

export const getPreviewWindowState = () => {
  return vscode.getState()?.view ?? null
}

export const savePreviewWindowState = (view: DiagramView) => {
  vscode.setState({
    view
  })
}
