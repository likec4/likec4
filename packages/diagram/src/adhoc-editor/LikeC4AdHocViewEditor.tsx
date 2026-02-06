import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import { memo, Profiler, useEffect, useRef } from 'react'
import { mapValues } from 'remeda'
import { FitViewPaddings } from '../base/const'
import { RootContainer } from '../components/RootContainer'
import { DefaultFeatures, DiagramFeatures } from '../context/DiagramFeatures'
import { EnsureMantine } from '../context/EnsureMantine'
import { FramerMotionConfig } from '../context/FramerMotionConfig'
import { IconRendererProvider } from '../context/IconRenderer'
import { TagStylesProvider } from '../context/TagStylesContext'
import { useDiagram } from '../hooks'
import { useId } from '../hooks/useId'
import { LikeC4DiagramXYFlow } from '../likec4diagram/DiagramXYFlow'
import { DiagramActorProvider } from '../likec4diagram/state/DiagramActorProvider'
import type { Types } from '../likec4diagram/types'
import { LikeC4Styles } from '../LikeC4Styles'
import { EditorPanel } from './EditorPanel'
import { useAdhocEditorActor, useAdhocView } from './hooks'
import type { AdhocViewService } from './state/actor.types'
import { AdhocEditorActorProvider } from './state/ActorProvider'

const noop = () => {}

const defaultFeatures = {
  ...mapValues(DefaultFeatures, () => false),
  enableFitView: true,
  enableReadOnly: true,
}

export function LikeC4AdHocViewEditor({ service }: { service: AdhocViewService }) {
  const id = useId()
  const initialRef = useRef({
    fitView: true,
    defaultNodes: [] as Types.Node[],
    defaultEdges: [] as Types.Edge[],
  })

  return (
    <EnsureMantine>
      <FramerMotionConfig>
        <Profiler id="LikeC4AdHocViewEditor" onRender={noop}>
          <IconRendererProvider value={null}>
            <AdhocEditorActorProvider service={service}>
              <DiagramFeatures features={defaultFeatures}>
                <LikeC4Styles id={id} />
                <TagStylesProvider rootSelector={`#${id}`}>
                  <RootContainer id={id}>
                    <XYFlowProvider {...initialRef.current}>
                      <LikeC4AdHocView id={id} />
                      {/* <EditorNavigationPanel /> */}
                      {/* <SelectElementOverlay /> */}
                      <EditorPanel />
                    </XYFlowProvider>
                  </RootContainer>
                </TagStylesProvider>
              </DiagramFeatures>
            </AdhocEditorActorProvider>
          </IconRendererProvider>
        </Profiler>
      </FramerMotionConfig>
    </EnsureMantine>
  )
}

// interface LikeC4AdHocViewProps {
//   view: LayoutedElementView
// }

const LikeC4AdHocView = memo(({ id }: { id: string }) => {
  const view = useAdhocView()
  return (
    <DiagramActorProvider
      id={id}
      view={view}
      zoomable
      pannable
      fitViewPadding={FitViewPaddings.withControls}
      nodesDraggable={false}
      nodesSelectable
    >
      <LikeC4DiagramXYFlow />
      <LikeC4AdHocEditorEvents />
    </DiagramActorProvider>
  )
})

const LikeC4AdHocEditorEvents = memo(() => {
  const actorRef = useAdhocEditorActor()
  const diagram = useDiagram()

  useEffect(() => {
    const subscription = actorRef.on('click.element', ({ id }) => {
      diagram.focusOnElement(id)
    })
    return () => subscription.unsubscribe()
  }, [actorRef, diagram])

  return null
})
