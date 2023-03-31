import type { DiagramEdge, DiagramNode } from '@likec4/core/types'
import { Diagram } from '@likec4/diagrams'
import { useEventListener, useWindowSize } from '@react-hookz/web/esm'
import { VSCodeButton, VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'
import { useCallback, useEffect, useState } from 'react'
import type { ExtensionToPanelProtocol } from '../protocol'
import { closePreviewWindow, getPreviewWindowState, imReady, notifyEdgeClick, notifyNodeClick, openView, savePreviewWindowState } from './vscode'

const App = () => {

  const windowSize = useWindowSize(undefined, false)

  const [{ view, loading }, updateState] = useState(() => {
    const view = getPreviewWindowState()
    return {
      view,
      loading: true
    }
  })

  useEffect(() => {
    if (view) {
      openView(view.id)
    } else {
      imReady()
    }
  }, [])

  useEventListener(window, 'message', ({ data }: MessageEvent<ExtensionToPanelProtocol>) => {
    switch (data.kind) {
      case 'update': {
        savePreviewWindowState(data.view)
        updateState({
          view: data.view,
          loading: false
        })
        return
      }
      default: {
        // Other messages come from the preview iframe.
        // vscode.postMessage(msg)
      }
    }
  })

  const viewId = view?.id ?? null

  const onNodeClick = useCallback((node: DiagramNode) => {
    if (node.navigateTo) {
      openView(node.navigateTo)
      return
    }
    if (viewId) {
      notifyNodeClick(viewId, node.id)
    }
  }, [viewId])

  const onEdgeClick = useCallback((edge: DiagramEdge) => {
    if (viewId) {
      notifyEdgeClick(viewId, edge.id)
    }
  }, [viewId])

  if (!view) {
    return <>
      <section>
        <p>Parsing your model...</p>
        <VSCodeProgressRing />
      </section>
      <section>
        <p>
          <VSCodeButton appearance="secondary" onClick={closePreviewWindow}>Close</VSCodeButton>
        </p>
      </section>
    </>
  }

  return <>
    <Diagram
      interactive
      className={'c4x-diagram'}
      diagram={view}
      width={windowSize.width}
      height={windowSize.height}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      padding={24}
    />
    {loading && <>
      <div className='c4x-diagram-loading-overlay'></div>
      <div className='c4x-diagram-loading'>
        <p>Updating...</p>
        <VSCodeProgressRing />
      </div>
    </>}
  </>
}

export default App
