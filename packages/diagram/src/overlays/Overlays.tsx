import { Box, Button, Code, Group, Notification } from '@mantine/core'
import { useCallbackRef } from '@mantine/hooks'
import { IconX } from '@tabler/icons-react'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { animate } from 'framer-motion/dom'
import { memo, useEffect, useMemo } from 'react'
import { type FallbackProps, ErrorBoundary } from 'react-error-boundary'
import { DiagramFeatures } from '../context'
import { useXYStore } from '../hooks'
import { useDiagramActor, useDiagramActorState } from '../hooks/useDiagramActor'
import { ElementDetailsCard } from './element-details/ElementDetailsCard'
import { Overlay } from './overlay/Overlay'
import { RelationshipDetails } from './relationship-details/RelationshipDetails'
import { RelationshipsBrowser } from './relationships-browser/RelationshipsBrowser'
// import { EdgeDetailsXYFlow } from './edge-details/EdgeDetailsXYFlow'
// import { ElementDetailsCard } from './element-details/ElementDetailsCard'
// import { OverlayContext, useOverlayDialog } from './OverlayContext'
// import * as css from './Overlays.css'
// import { RelationshipsOverlay } from './relationships-of/RelationshipsOverlay'

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorString = error instanceof Error ? error.message : 'Unknown error'
  return (
    <Box pos={'fixed'} top={0} left={0} w={'100%'} p={0} style={{ zIndex: 1000 }}>
      <Notification
        icon={<IconX style={{ width: 16, height: 16 }} />}
        styles={{
          icon: {
            alignSelf: 'flex-start',
          },
        }}
        color={'red'}
        title={'Oops, something went wrong'}
        p={'xl'}
        withCloseButton={false}>
        <Code block>{errorString}</Code>
        <Group gap={'xs'} mt="xl">
          <Button color="gray" size="xs" variant="light" onClick={() => resetErrorBoundary()}>Reset</Button>
        </Group>
      </Notification>
    </Box>
  )
}

export const Overlays = memo(() => {
  const xyflowDomNode = useXYStore(s => s.domNode)
  const xyflowRendererDom = useMemo(() => xyflowDomNode?.querySelector('.react-flow__renderer') ?? null, [
    xyflowDomNode,
  ])
  const { send } = useDiagramActor()
  const {
    relationshipsBrowserActor,
    relationshipDetailsActor,
    activeElementDetailsOf,
    viewId,
    fromNode,
    rectFromNode,
  } = useDiagramActorState(s => ({
    relationshipsBrowserActor: s.children.relationshipsBrowser,
    relationshipDetailsActor: s.children.relationshipDetails,
    viewId: s.context.view.id,
    activeElementDetailsOf: s.context.activeElementDetails?.fqn ?? null,
    fromNode: s.context.activeElementDetails?.fromNode ?? null,
    rectFromNode: s.context.activeElementDetails?.nodeRectScreen ?? null,
  }))

  const isMotionReduced = useReducedMotion() ?? false

  const isActiveOverlay = !!activeElementDetailsOf

  useEffect(() => {
    if (!xyflowRendererDom || isMotionReduced) return
    animate(xyflowRendererDom, {
      opacity: isActiveOverlay ? 0.7 : 1,
      filter: isActiveOverlay ? 'grayscale(1)' : 'grayscale(0)',
      transform: isActiveOverlay ? `perspective(400px) translateZ(-12px) translateY(3px)` : `translateY(0)`,
    }, {
      duration: isActiveOverlay ? 0.35 : 0.17,
    })
  }, [isActiveOverlay, xyflowRendererDom])

  // )
  // const diagramStore = useDiagramStoreApi()
  // const {
  //   activeOverlay,
  //   viewId,
  // } = useDiagramState(s => ({
  //   activeOverlay: s.activeOverlay,
  //   viewId: s.view.id,
  // }))

  // const onCloseCbRef = useRef<(() => void)>(undefined)

  // const ctxValue = useMemo(() => ({
  //   openOverlay: ((overlay) => {
  //     diagramStore.getState().openOverlay(overlay)
  //   }) as DiagramState['openOverlay'],
  //   close: (cb?: () => void) => {
  //     onCloseCbRef.current = cb
  //     diagramStore.getState().closeOverlay()
  //   },
  // }), [diagramStore])

  // const onExitComplete = () => {
  //   onCloseCbRef.current?.()
  //   onCloseCbRef.current = undefined
  // }

  // const isActive = !!activeOverlay
  // useHotkeys(
  //   isActive
  //     ? [
  //       ['Escape', (e) => {
  //         e.stopPropagation()
  //         ctxValue.close()
  //       }, { preventDefault: true }],
  //     ]
  //     : [],
  // )

  // useLifecycleLogger('Overlays', [activeElementDetailsOf, viewId, fromNode, rectFromNode])

  const onClose = useCallbackRef(() => {
    relationshipsBrowserActor?.send({ type: 'close' })
    relationshipDetailsActor?.send({ type: 'close' })
    send({ type: 'close.overlay' })
  })

  return (
    <DiagramFeatures.Overlays>
      <ErrorBoundary FallbackComponent={Fallback} onReset={onClose}>
        <AnimatePresence>
          {relationshipsBrowserActor && (
            <Overlay
              key={'relationships-browser'}
              onClose={onClose}>
              <RelationshipsBrowser actorRef={relationshipsBrowserActor} />
            </Overlay>
          )}
          {relationshipDetailsActor && (
            <Overlay
              key={'relationship-details'}
              onClose={onClose}>
              <RelationshipDetails actorRef={relationshipDetailsActor} />
            </Overlay>
          )}
        </AnimatePresence>
        {/* TODO: Somehow ElementDetailsCard does not work properly inside AnimatePresence} */}
        {!!activeElementDetailsOf && (
          <ElementDetailsCard
            key={'element-details'}
            fqn={activeElementDetailsOf}
            viewId={viewId}
            fromNode={fromNode}
            rectFromNode={rectFromNode}
            onClose={onClose}
          />
        )}
      </ErrorBoundary>
    </DiagramFeatures.Overlays>
  )
})
