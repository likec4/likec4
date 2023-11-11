import {
  nonexhaustive,
  type DiagramEdge,
  type DiagramNode,
  type DiagramView,
  hasAtLeast
} from '@likec4/core'
import { useEventListener, useToggle } from '@react-hookz/web/esm'
import { VSCodeButton, VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'
import { ArrowLeftIcon } from 'lucide-react'
import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import type { ExtensionToPanelProtocol } from '../protocol'
import { LikeC4Diagram } from './LikeC4Diagram'
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
import { useViewHistory } from './useViewHistory'

const ErrorMessage = () => (
  <div className='likec4-error-message'>
    <p>Oops, something went wrong.</p>
  </div>
)

const App = () => {
  const lastNodeContextMenuRef = useRef<DiagramNode | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [view, setView] = useState(getPreviewWindowState)

  const updateView = useCallback((view: DiagramView | null) => {
    if (view) {
      lastNodeContextMenuRef.current = null
      savePreviewWindowState(view)
      setState('ready')
      setView(view)
    } else {
      setState('error')
    }
  }, [])

  useEffect(() => {
    if (view) {
      openView(view.id)
    } else {
      imReady()
    }
  }, [])

  const prevView = useViewHistory(view)

  useEventListener(window, 'message', ({ data }: MessageEvent<ExtensionToPanelProtocol>) => {
    switch (data.kind) {
      case 'update': {
        updateView(data.view)
        return
      }
      case 'error': {
        updateView(null)
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
    if (hasAtLeast(edge.relations, 1)) {
      goToRelation(edge.relations[0])
    }
  }, [])

  if (!view) {
    return (
      <div className='likec4-parsing-screen'>
        {state === 'error' && (
          <section>
            <h3>Oops, invalid view</h3>
            <p>Failed to parse your model.</p>
          </section>
        )}
        {state !== 'error' && (
          <section>
            <p>Parsing your model...</p>
            <VSCodeProgressRing />
          </section>
        )}
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
    <>
      <LikeC4Diagram
        diagram={view}
        onNodeClick={onNodeClick}
        onNodeContextMenu={(nd, e) => {
          e.cancelBubble = true
          lastNodeContextMenuRef.current = nd
        }}
        onEdgeClick={onEdgeClick}
        onStageClick={() => {
          goToViewSource(view.id)
        }}
      />
      {state === 'error' && <ErrorMessage />},
      {state === 'loading' && (
        <>
          <div className='likec4-diagram-loading-overlay'></div>
          <div className='likec4-diagram-loading'>
            <p>Updating...</p>
            <VSCodeProgressRing />
          </div>
        </>
      )}
      {prevView && (
        <div className='likec4-toolbar'>
          <div className='likec4-toolbar-left'>
            <VSCodeButton
              appearance='icon'
              onClick={e => {
                e.stopPropagation()
                goToViewSource(prevView.id)
                openView(prevView.id)
                // optimistic update
                updateView(prevView)
              }}
            >
              <ArrowLeftIcon />
            </VSCodeButton>
          </div>
        </div>
      )}
    </>
  )
}

export default App
