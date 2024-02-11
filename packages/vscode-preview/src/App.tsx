import { type DiagramNode, type DiagramView, hasAtLeast } from '@likec4/core'
import { LikeC4ViewEditor } from '@likec4/diagram'
import { VSCodeButton, VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'
import { ArrowLeftIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useViewHistory } from './useViewHistory'
import { extensionApi, getPreviewWindowState, savePreviewWindowState, useMessenger } from './vscode'

const ErrorMessage = ({ error }: { error: string | null }) => (
  <div className="likec4-error-message">
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

  if (!view) {
    return (
      <div className="likec4-parsing-screen">
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
            <VSCodeButton appearance="secondary" onClick={extensionApi.closeMe}>
              Close
            </VSCodeButton>
          </p>
        </section>
      </div>
    )
  }

  return (
    <>
      <div className="likec4-container" data-vscode-context='{"preventDefaultContextMenuItems": true}'>
        <LikeC4ViewEditor
          view={view}
          nodesDraggable={false}
          onNavigateTo={(node) => {
            lastNodeContextMenuRef.current = null
            extensionApi.goToViewSource(node.navigateTo)
            extensionApi.openView(node.navigateTo)
          }}
          onNodeClick={(node, e) => {
            lastNodeContextMenuRef.current = null
            extensionApi.goToElement(node.id)
            e.stopPropagation()
          }}
          onNodeContextMenu={(node, e) => {
            lastNodeContextMenuRef.current = node
            // e.stopPropagation()
            // e.preventDefaulzt()
          }}
          onEdgeClick={(edge, e) => {
            lastNodeContextMenuRef.current = null
            if (hasAtLeast(edge.relations, 1)) {
              extensionApi.goToRelation(edge.relations[0])
              e.stopPropagation()
            }
          }}
          onChange={(change) => {
            extensionApi.triggerChange({ ...change, viewId: view.id })
          }}
        />
      </div>
      {state === 'error' && <ErrorMessage error={error} />},
      {state === 'loading' && (
        <>
          <div className="likec4-diagram-loading-overlay"></div>
          <div className="likec4-diagram-loading">
            <p>Updating...</p>
            <VSCodeProgressRing />
          </div>
        </>
      )}
      {prevView && (
        <div className="likec4-toolbar">
          <div className="likec4-toolbar-left">
            <VSCodeButton
              appearance="icon"
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
