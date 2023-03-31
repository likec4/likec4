import { VSCodeButton, VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'
import { closePreviewWindow, savePreviewWindowState, getPreviewWindowState, imReady, openView, goToViewSource, goToSource, goToRelation } from './vscode'
import { useEventListener, useWindowSize } from '@react-hookz/web/esm'
import { Diagram } from '@likec4/diagrams'
import type { ExtensionToPanelProtocol } from '../protocol'
import { useCallback, useEffect, useState } from 'react'
import type { DiagramEdge, DiagramNode } from '@likec4/core/types'

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
    // if (node.routeToView && node.routeToView !== viewId) {
    //   goToViewSource(node.routeToView)
    //   openView(node.routeToView)
    //   return
    // }
    goToSource(node.id)
  }, [viewId])

  const onEdgeClick = useCallback((edge: DiagramEdge) => {
    // goToRelation(edge.relations[0])
  }, [])

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
      id={view.id}
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
