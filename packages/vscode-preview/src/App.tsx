import { hasAtLeast, type DiagramEdge, type DiagramNode, type DiagramView } from '@likec4/core'
import { VSCodeButton, VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'
import { ArrowLeftIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LikeC4Diagram } from './LikeC4Diagram'
import { useViewHistory } from './useViewHistory'
import { extensionApi, getPreviewWindowState, savePreviewWindowState, useMessenger } from './vscode'

const ErrorMessage = ({ error }: { error: string | null }) => (
  <div className='likec4-error-message'>
    <p>
      Oops, something went wrong
      {error && (
        <>
          <br />
          {error}
        </>
      )}
    </p>
  </div>
)

const App = () => {
  const lastNodeContextMenuRef = useRef<DiagramNode | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [view, setView] = useState(getPreviewWindowState)
  const [error, setError] = useState<string | null>(null)

  const updateView = useCallback((view: DiagramView | null) => {
    if (view) {
      lastNodeContextMenuRef.current = null
      savePreviewWindowState(view)
      setState('ready')
      setView(view)
      setError(null)
    } else {
      setState('error')
      setError('View not found')
    }
  }, [])

  useMessenger({
    onDiagramUpdate: updateView,
    onError: error => {
      setState('error')
      setError(error)
    },
    onGetHoveredElement: () => {
      return lastNodeContextMenuRef.current?.id ?? null
    }
  })

  useEffect(() => {
    extensionApi.imReady()
  }, [])

  const prevView = useViewHistory(view)

  const onNodeClick = useCallback((node: DiagramNode) => {
    lastNodeContextMenuRef.current = null
    if (node.navigateTo) {
      extensionApi.goToViewSource(node.navigateTo)
      extensionApi.openView(node.navigateTo)
      return
    }
    extensionApi.goToElement(node.id)
  }, [])

  const onEdgeClick = useCallback((edge: DiagramEdge) => {
    lastNodeContextMenuRef.current = null
    if (hasAtLeast(edge.relations, 1)) {
      extensionApi.goToRelation(edge.relations[0])
    }
  }, [])

  if (!view) {
    return (
      <div className='likec4-parsing-screen'>
        {state === 'error' && (
          <section>
            <h3>Oops, invalid view</h3>
            <p>
              Failed to parse your model:
              {error && (
                <>
                  <br />
                  {error}
                </>
              )}
            </p>
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
            <VSCodeButton appearance='secondary' onClick={extensionApi.closeMe}>
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
          lastNodeContextMenuRef.current = nd
          e.cancelBubble = true
        }}
        onEdgeClick={onEdgeClick}
        onStageClick={() => {
          extensionApi.goToViewSource(view.id)
        }}
      />
      {state === 'error' && <ErrorMessage error={error} />},
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
                extensionApi.goToViewSource(prevView.id)
                extensionApi.openView(prevView.id)
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
