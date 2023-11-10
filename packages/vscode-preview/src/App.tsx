import { nonexhaustive, type DiagramEdge, type DiagramNode, type DiagramView } from '@likec4/core'
import { Diagram } from '@likec4/diagrams'
import { useEventListener, useWindowSize } from '@react-hookz/web/esm'
import { VSCodeButton, VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'
import { ArrowLeftIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ExtensionToPanelProtocol } from '../protocol'
import {
  closePreviewWindow,
  getPreviewWindowState,
  goToElement,
  goToRelation,
  goToViewSource,
  imReady,
  openView,
  savePreviewWindowState
} from './vscode'

const Paddings = [30, 20, 20, 20] as const

const App = () => {
  const windowSize = useWindowSize(undefined, false)
  const lastNodeContextMenuRef = useRef<DiagramNode | null>(null)

  const [{ view, loading }, updateState] = useState(() => {
    const view = getPreviewWindowState()
    return {
      view,
      loading: true
    }
  })

  const viewsHistoryRef = useRef<DiagramView[]>(view ? [view] : [])

  useEffect(() => {
    if (view) {
      openView(view.id)
    } else {
      imReady()
    }
  }, [])

  if (view) {
    const [head, prev] = viewsHistoryRef.current
    if (head && prev) {
      if (view.id === prev.id) {
        viewsHistoryRef.current.shift()
      } else if (view.id !== head.id) {
        viewsHistoryRef.current.unshift(view)
      }
      if (viewsHistoryRef.current.length > 20) {
        viewsHistoryRef.current.pop()
      }
    } else {
      if (!head || head.id !== view.id) {
        viewsHistoryRef.current.unshift(view)
      }
    }
  }

  useEventListener(window, 'message', ({ data }: MessageEvent<ExtensionToPanelProtocol>) => {
    switch (data.kind) {
      case 'update': {
        lastNodeContextMenuRef.current = null
        savePreviewWindowState(data.view)
        updateState({
          view: data.view,
          loading: false
        })
        return
      }
      case 'onContextMenuOpenSource': {
        const nd = lastNodeContextMenuRef.current
        if (nd) {
          lastNodeContextMenuRef.current = null
          goToElement(nd.id)
        }
        return
      }
      default: {
        nonexhaustive(data)
      }
    }
  })

  const onNodeClick = useCallback((node: DiagramNode) => {
    if (node.navigateTo) {
      goToViewSource(node.navigateTo)
      openView(node.navigateTo)
      return
    }
    goToElement(node.id)
  }, [])

  const onEdgeClick = useCallback((edge: DiagramEdge) => {
    const relation = edge.relations[0]
    if (relation) {
      goToRelation(relation)
    }
  }, [])

  if (!view) {
    return (
      <div className='likec4-parsing-screen'>
        <section>
          <p>Parsing your model...</p>
          <VSCodeProgressRing />
        </section>
        <section>
          <p>
            <VSCodeButton appearance='secondary' onClick={closePreviewWindow}>
              Close
            </VSCodeButton>
          </p>
        </section>
      </div>
    )
  }

  return (
    <div data-vscode-context='{"preventDefaultContextMenuItems": true}'>
      <Diagram
        className={'likec4-layer likec4-diagram'}
        diagram={view}
        padding={Paddings}
        width={windowSize.width}
        height={windowSize.height}
        onNodeClick={onNodeClick}
        onNodeContextMenu={(nd, e) => {
          e.cancelBubble = true
          lastNodeContextMenuRef.current = nd
        }}
        onStageContextMenu={(stage, e) => {
          e.evt.stopPropagation()
        }}
        onEdgeClick={onEdgeClick}
        onStageClick={() => {
          goToViewSource(view.id)
        }}
      />
      {loading && (
        <>
          <div className='likec4-diagram-loading-overlay'></div>
          <div className='likec4-diagram-loading'>
            <p>Updating...</p>
            <VSCodeProgressRing />
          </div>
        </>
      )}
      {viewsHistoryRef.current.length > 1 && (
        <div className='likec4-toolbar'>
          <div className='likec4-toolbar-left'>
            <VSCodeButton
              appearance='icon'
              onClick={e => {
                e.stopPropagation()
                const [_, prev] = viewsHistoryRef.current
                if (prev) {
                  goToViewSource(prev.id)
                  openView(prev.id)
                  // optimistic update
                  updateState({
                    view: prev,
                    loading: false
                  })
                }
              }}
            >
              <ArrowLeftIcon />
            </VSCodeButton>
          </div>
          {/* <div className='likec4-toolbar-right'>
            <VSCodeButton appearance='secondary' onClick={closePreviewWindow}>
              Export
            </VSCodeButton>
          </div> */}
        </div>
      )}
    </div>
  )
}

export default App
