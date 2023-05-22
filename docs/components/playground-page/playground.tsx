import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '$/components/ui/dropdown-menu'
import { cn } from '$/lib'
import { Diagram, type DiagramPaddings } from '@likec4/diagrams'
import { useMeasure, type Measures } from '@react-hookz/web/esm'
import {
  disableBodyScroll,
  enableBodyScroll
} from "body-scroll-lock-upgrade"
import MonacoEditor from './editor/monaco'
import { useAtom, useAtomValue } from 'jotai'
import { ChevronDown } from 'lucide-react'
import { Suspense, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Button } from '../ui/button'
import type { PlaygroundDataProviderProps } from './data/PlaygroundDataProvider'
import { PlaygroundDataProvider } from './data/PlaygroundDataProvider'
import { useCurrentDiagram, useCurrentFile, useInitialFiles, useRevealInEditor, useUpdateCurrentFile } from './data'
import { diagramIdAtom, viewsReadyAtom } from './data'
import styles from './playground.module.css'
import PlaygroundViewD2 from './view-d2'
import PlaygroundViewDot from './view-dot'

const ViewModes = {
  'diagram': 'React Diagram',
  'd2': 'D2',
  'dot': 'Graphviz DOT'
} as const
type ViewMode = keyof typeof ViewModes

const PlaygroundPreview = ({ sidebarWidth, container }: { sidebarWidth: number, container: Measures }) => {
  const padding = useMemo((): DiagramPaddings => [20, 20, 20, sidebarWidth + 20], [sidebarWidth])
  const [viewId, setDiagramFromViewId] = useAtom(diagramIdAtom)
  const diagramState = useCurrentDiagram()
  const [viewMode, setViewMode] = useState<ViewMode>('diagram')
  const isReady = useAtomValue(viewsReadyAtom)
  const revealInEditor = useRevealInEditor()

  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    if (isFirstRenderRef.current && viewId) {
      isFirstRenderRef.current = false
      revealInEditor({ view: viewId })
      return
    }
  }, [viewId])

  if (diagramState.state !== 'hasData') {
    return <div className={styles.diagram}
      style={{
        padding: '2rem',
        paddingLeft: `calc(2rem + ${sidebarWidth}px)`
      }}
    >
      {!isReady && (
        <h1>Parsing...</h1>
      )}
      {isReady && (
        <h1>{viewId ? `View "${viewId}" is not parsed or not found` : 'Select view to preview'}</h1>
      )}
    </div>
  }

  const diagram = diagramState.data
  if (!diagram) {
    return <div className={styles.diagram}
      style={{
        padding: '2rem',
        paddingLeft: `calc(2rem + ${sidebarWidth}px)`
      }}
    >
        <h1>{viewId ? `View "${viewId}" is not parsed or not found` : 'Select view to preview'}</h1>
    </div>
  }

  return <>
    {viewMode === 'diagram' && <>
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
    </>}
    {viewMode !== 'diagram' && (
      <div
        className={cn(styles.diagram, 'pt-12', 'flex')}
        style={{
          paddingLeft: sidebarWidth + 5
        }}>
        {viewMode === 'd2' && <PlaygroundViewD2 diagram={diagram} />}
        {viewMode === 'dot' && <PlaygroundViewDot diagram={diagram} />}
      </div>
    )}
    <div
      className={cn(
        'absolute top-0 left-0 right-0 pr-5',
        'flex', 'items-center', 'justify-between'
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
            'hover:text-blue-500 dark:hover:text-blue-400',
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
        >{diagram.title}</h2>
      </div>
      <div className='flex-initial flex-shrink-0'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className='rounded-sm'>
              {ViewModes[viewMode]}
              <ChevronDown className='ml-2 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuRadioGroup value={viewMode} onValueChange={v => setViewMode(v as ViewMode)}>
              <DropdownMenuRadioItem value="diagram">{ViewModes.diagram}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="d2">{ViewModes.d2}</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dot">{ViewModes.dot}</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div >
  </>
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

  return <div id={id} ref={containerRef} className={styles.playground}>
    {sideBarMeasures && containerMeasures && <Suspense fallback="Loading...">
        <PlaygroundPreview sidebarWidth={sideBarMeasures.width} container={containerMeasures} />
    </Suspense>}
    <div ref={sidebarRef} className={styles.sidebar}>
      <MonacoEditor
        currentFile={current}
        initialFiles={initialFiles}
        onChange={updateCurrentFile}
      />
    </div>
  </div>
}

export default function PlaygroundWrapper({variant}: PlaygroundDataProviderProps) {
  return <PlaygroundDataProvider variant={variant}>
    <Playground />
  </PlaygroundDataProvider>
}
