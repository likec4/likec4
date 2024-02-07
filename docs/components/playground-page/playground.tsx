import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '$/components/ui/dropdown-menu'
import { cn } from '$/lib'
import type { DiagramView, DiagramPaddings } from '@likec4/diagrams'
import { Diagram } from '@likec4/diagrams'
import { useMeasure, type Measures } from '@react-hookz/web'
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock-upgrade'
import MonacoEditor from './editor/monaco'
import { useAtom, useAtomValue } from 'jotai'
import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Button } from '$/components/ui/button'
import {
  PlaygroundDataProvider,
  type PlaygroundDataProviderProps
} from './data/PlaygroundDataProvider'
import type { DiagramState } from './data'
import {
  useCurrentDiagramState,
  useCurrentFile,
  useInitialFiles,
  useRevealInEditor,
  useUpdateCurrentFile
} from './data'
import { diagramIdAtom, viewsReadyAtom } from './data'
import styles from './playground.module.css'
import PlaygroundViewD2 from './view-d2'
import PlaygroundViewDot from './view-dot'
import PlaygroundViewMermaid from './view-mmd'
import { keys } from 'rambdax'
import PlaygroundViewNotReady from './view-not-ready'

const ViewModes = {
  diagram: 'React Diagram',
  d2: 'D2',
  plantuml: 'PlantUML',
  structurizr: 'Structurizr',
  mermaid: 'Mermaid',
  dot: 'Graphviz DOT'
} as const
type ViewMode = keyof typeof ViewModes

const renderView = (viewMode: Omit<ViewMode, 'diagram'>, state: DiagramState) => {
  switch (viewMode) {
    case 'd2':
      return <PlaygroundViewD2 diagram={state.diagram} />
    case 'dot':
      return <PlaygroundViewDot diagram={state.diagram} dot={state.dot} />
    case 'mermaid':
      return <PlaygroundViewMermaid diagram={state.diagram} />
    default:
      return <PlaygroundViewNotReady diagram={state.diagram} />
  }
}

const PlaygroundPreview = ({
  sidebarWidth,
  container
}: {
  sidebarWidth: number
  container: Measures
}) => {
  const padding = useMemo((): DiagramPaddings => [20, 20, 20, sidebarWidth + 20], [sidebarWidth])
  const [viewId, setDiagramFromViewId] = useAtom(diagramIdAtom)
  const diagramState = useCurrentDiagramState()
  const [viewMode, setViewMode] = useState<ViewMode>('diagram')
  const isReady = useAtomValue(viewsReadyAtom)
  const revealInEditor = useRevealInEditor()

  const previousStateRef = useRef<DiagramState | null>(null)
  const loadState = diagramState.state
  const currentState = (loadState === 'hasData' && diagramState.data) || null
  useEffect(() => {
    if (loadState === 'hasData' && currentState) {
      previousStateRef.current = currentState
    }
  }, [loadState, currentState])
  const previousState = previousStateRef.current

  if (loadState !== 'hasData' && !previousState) {
    //console.log('PlaygroundPreview: diagramState.state !== "hasData" && !previousDiagram')
    return (
      <div
        className={styles.diagram}
        style={{
          padding: '2rem',
          paddingLeft: `calc(2rem + ${sidebarWidth}px)`
        }}
      >
        {!isReady && <h1>Parsing...</h1>}
        {isReady && (
          <h1>
            {viewId ? `View "${viewId}" is not parsed or not found` : 'Select view to preview'}
          </h1>
        )}
      </div>
    )
  }
  const state = currentState || previousState

  if (!state) {
    //console.log('PlaygroundPreview: !diagram')
    return (
      <div
        className={styles.diagram}
        style={{
          padding: '2rem',
          paddingLeft: `calc(2rem + ${sidebarWidth}px)`
        }}
      >
        <h1>{viewId ? `View "${viewId}" is not parsed or not found` : 'Select view to preview'}</h1>
      </div>
    )
  }
  const { diagram } = state

  return (
    <>
      {viewMode === 'diagram' && (
        <>
          <Diagram
            className={styles.diagram}
            diagram={diagram}
            width={container.width}
            height={container.height}
            padding={padding}
            onNodeClick={({ id, navigateTo }) => {
              if (navigateTo && navigateTo !== viewId) {
                setDiagramFromViewId(navigateTo)
                revealInEditor({ view: navigateTo })
                return
              }
              revealInEditor({ element: id })
            }}
            onEdgeClick={({ relations }) => {
              const relation = relations[0]
              if (relation) {
                revealInEditor({ relation })
                return
              }
            }}
          />
        </>
      )}
      {viewMode !== 'diagram' && (
        <div
          className={cn(styles.diagram, 'pt-12', 'flex')}
          style={{
            paddingLeft: sidebarWidth + 5
          }}
        >
          {renderView(viewMode, state)}
        </div>
      )}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 pr-5',
          'flex',
          'items-center',
          'justify-between'
        )}
        style={{
          paddingLeft: sidebarWidth + 20
        }}
      >
        <div className='flex-initial flex-shrink-0'>
          <h3
            className={cn(
              'mt-2 mb-0',
              'text-xs text-gray-500 dark:text-gray-400',
              'cursor-pointer',
              'hover:text-blue-500 dark:hover:text-blue-400'
            )}
            onClick={e => {
              e.stopPropagation()
              revealInEditor({ view: diagram.id })
            }}
          >
            view id: {diagram.id}
          </h3>
          <h2
            className={cn(
              'mt-0 mb-2',
              'select-none',
              'text-md font-medium tracking-tight',
              'text-slate-900 dark:text-slate-100'
            )}
          >
            {diagram.title}
          </h2>
        </div>
        <div className='flex-initial flex-shrink-0'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' className='rounded-sm'>
                {ViewModes[viewMode]}
                <ChevronDown className='ml-2 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuRadioGroup
                value={viewMode}
                onValueChange={v => setViewMode(v as ViewMode)}
              >
                {keys(ViewModes).map(key => (
                  <DropdownMenuRadioItem key={key} value={key}>
                    {ViewModes[key]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )
}

function Playground() {
  const id = useId()
  const [containerMeasures, containerRef] = useMeasure<HTMLDivElement>()
  const [sideBarMeasures, sidebarRef] = useMeasure<HTMLDivElement>()

  const current = useCurrentFile()
  const initialFiles = useInitialFiles()
  const updateCurrentFile = useUpdateCurrentFile()

  useEffect(() => {
    const target = document.getElementById(id)
    if (!target) {
      return
    }
    disableBodyScroll(target)
    return () => {
      enableBodyScroll(target)
    }
  }, [id])

  return (
    <div id={id} ref={containerRef} className={styles.playground}>
      {sideBarMeasures && containerMeasures && (
        <>
          <PlaygroundPreview sidebarWidth={sideBarMeasures.width} container={containerMeasures} />
        </>
      )}
      <div ref={sidebarRef} className={styles.sidebar}>
        <MonacoEditor
          currentFile={current}
          initialFiles={initialFiles}
          onChange={updateCurrentFile}
        />
      </div>
    </div>
  )
}

export default function PlaygroundWrapper({ variant }: PlaygroundDataProviderProps) {
  return (
    <PlaygroundDataProvider variant={variant}>
      <Playground />
    </PlaygroundDataProvider>
  )
}
