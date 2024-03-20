import { type DiagramNode, type DiagramView, hasAtLeast } from '@likec4/core'
import { LikeC4Diagram as LikeC4ViewEditor } from '@likec4/diagram'
import { ActionIcon } from '@mantine/core'
import { VSCodeButton, VSCodeProgressRing } from '@vscode/webview-ui-toolkit/react'
import { ArrowLeftIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Toolbar } from './Toolbar'
import { cssToolbarLeft } from './Toolbar.css'
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
  const lastClickedNodeRef = useRef<string>()
  const lastNodeContextMenuRef = useRef<DiagramNode | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [view, setView] = useState(getPreviewWindowState)
  const [error, setError] = useState<string | null>(null)

  const updateView = useCallback((view: DiagramView | null) => {
    if (view) {
      lastClickedNodeRef.current = undefined
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
          controls={false}
          nodesDraggable={false}
          onNavigateTo={({ element }) => {
            lastClickedNodeRef.current = undefined
            lastNodeContextMenuRef.current = null
            extensionApi.goToViewSource(element.navigateTo)
            extensionApi.openView(element.navigateTo)
          }}
          onNodeClick={({ element, xynode, event }) => {
            if (lastClickedNodeRef.current === element.id) {
              lastNodeContextMenuRef.current = null
              extensionApi.goToElement(element.id)
              event.stopPropagation()
              return
            }
            lastClickedNodeRef.current = element.id
          }}
          onNodeContextMenu={({ element, xynode, event }) => {
            lastClickedNodeRef.current = undefined
            lastNodeContextMenuRef.current = element
          }}
          onCanvasContextMenu={event => {
            event.stopPropagation()
            event.preventDefault()
          }}
          onEdgeContextMenu={({ event }) => {
            event.stopPropagation()
            event.preventDefault()
          }}
          onEdgeClick={({ relation, event }) => {
            lastClickedNodeRef.current = undefined
            lastNodeContextMenuRef.current = null
            if (hasAtLeast(relation.relations, 1)) {
              extensionApi.goToRelation(relation.relations[0])
              event.stopPropagation()
            }
          }}
          onChange={({ changes }) => {
            extensionApi.change(view.id, changes)
          }}
          onCanvasDblClick={() => {
            extensionApi.goToViewSource(view.id)
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
        <div className={cssToolbarLeft}>
          <ActionIcon
            color="gray"
            variant="light"
            onClick={e => {
              e.stopPropagation()
              extensionApi.goToViewSource(prevView.id)
              extensionApi.openView(prevView.id)
              // optimistic update
              updateView(prevView)
            }}>
            <ArrowLeftIcon style={{ width: '70%', height: '70%' }} />
          </ActionIcon>
        </div>
      )}
      <Toolbar view={view} />
    </>
  )
}

export default App
