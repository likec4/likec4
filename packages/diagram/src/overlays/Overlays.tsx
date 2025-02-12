import { nonexhaustive } from '@likec4/core'
import { Box, Button, Code, Group, Notification } from '@mantine/core'
import { useCallbackRef } from '@mantine/hooks'
import { IconX } from '@tabler/icons-react'
import { useSelector as useXStateSelector } from '@xstate/react'
import { deepEqual, shallowEqual } from 'fast-equals'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { animate } from 'framer-motion/dom'
import { memo, useEffect, useMemo } from 'react'
import { type FallbackProps, ErrorBoundary } from 'react-error-boundary'
import type { SnapshotFrom } from 'xstate'
import { DiagramFeatures } from '../context'
import { useXYStore } from '../hooks'
import { useDiagram } from '../hooks/useDiagram'
import { useDiagramActorState } from '../hooks/useDiagramActor'
import { useOverlays, useOverlaysActor } from '../hooks/useOverlays'
import type { MachineSnapshot } from '../likec4diagram/state/machine'
import { ElementDetails } from './element-details/ElementDetails'
import { ElementDetailsCard } from './element-details/ElementDetailsCard'
import { Overlay } from './overlay/Overlay'
import type { OverlaysActorRef } from './overlaysActor'
import { RelationshipDetails } from './relationship-details/RelationshipDetails'
import type { RelationshipsBrowserActorRef } from './relationships-browser/actor'
import { RelationshipsBrowser } from './relationships-browser/RelationshipsBrowser'

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
        <ScrollAreaAutosize maw={'100%'} mah={400}>
          <Code block>{errorString}</Code>
        </ScrollAreaAutosize>
        <Group gap={'xs'} mt="xl">
          <Button color="gray" size="xs" variant="light" onClick={() => resetErrorBoundary()}>Reset</Button>
        </Group>
      </Notification>
    </Box>
  )
}

const select = (s: SnapshotFrom<OverlaysActorRef>) => s.context.overlays
function useCurrentOverlays() {
  const overlaysActorRef = useOverlaysActor()
  return useXStateSelector(overlaysActorRef, select, shallowEqual)
}

// const selector = (s: MachineSnapshot) => ({
// relationshipsBrowserActor: s.children.relationshipsBrowser,
// relationshipDetailsActor: s.children.relationshipDetails,
// viewId: s.context.view.id,
// activeElementDetailsOf: s.context.activeElementDetails?.fqn ?? null,
// fromNode: s.context.activeElementDetails?.fromNode ?? null,
// rectFromNode: s.context.activeElementDetails?.nodeRectScreen ?? null,
// })
// const equals = (a: ReturnType<typeof selector>, b: ReturnType<typeof selector>) =>
// a.relationshipDetailsActor == b.relationshipDetailsActor &&
// a.relationshipsBrowserActor == b.relationshipsBrowserActor &&
// a.activeElementDetailsOf === b.activeElementDetailsOf &&
// a.viewId === b.viewId &&
// a.fromNode === b.fromNode &&
// deepEqual(a.rectFromNode, b.rectFromNode)

export function Overlays() {
  const xyflowDomNode = useXYStore(s => s.domNode)
  const xyflowRendererDom = useMemo(() => xyflowDomNode?.querySelector('.react-flow__renderer') ?? null, [
    xyflowDomNode,
  ])
  const overlaysActor = useOverlays()
  const diagram = useDiagram()
  // const {
  //   // relationshipsBrowserActor,
  //   // relationshipDetailsActor,
  //   // activeElementDetailsOf,
  //   viewId,
  //   // fromNode,
  //   // rectFromNode,
  // } = useDiagramActorState(selector, equals)
  const overlays = useCurrentOverlays()

  // const relationshipsBrowserActor: RelationshipsBrowserActorRef | null = (overlays[0] as any) ?? null
  // consola.debug('relationshipsBrowserActor.src', relationshipsBrowserActor?.src)
  const isMotionReduced = useReducedMotion() ?? false

  const isActiveOverlay = overlays.length > 0

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

  const onClose = useCallbackRef(() => {
    // diagram.closeOverlay()
    // relationshipsBrowserActor?.send({ type: 'close' })
    // relationshipDetailsActor?.send({ type: 'close' })
    // send({ type: 'close.overlay' })
  })

  const overlaysReact = overlays.map((overlay) => {
    switch (overlay.type) {
      case 'relationshipsBrowser':
        return (
          <Overlay
            key={overlay.actorRef.id}
            onClose={() => overlaysActor.close(overlay.actorRef)}>
            <RelationshipsBrowser actorRef={overlay.actorRef} />
          </Overlay>
        )
      case 'relationshipDetails':
        return (
          <Overlay
            key={overlay.actorRef.id}
            onClose={() => overlaysActor.close(overlay.actorRef)}>
            <RelationshipDetails actorRef={overlay.actorRef} />
          </Overlay>
        )
      case 'elementDetails':
        return (
          <ElementDetails
            key={overlay.actorRef.id}
            actorRef={overlay.actorRef} />
        )
      default:
        nonexhaustive(overlay)
    }
  })

  return (
    <DiagramFeatures.Overlays>
      <ErrorBoundary FallbackComponent={Fallback} onReset={() => overlaysActor.closeAll()}>
        <AnimatePresence onExitComplete={onClose}>
          {overlaysReact}
        </AnimatePresence>
      </ErrorBoundary>
    </DiagramFeatures.Overlays>
  )
}
Overlays.displayName = 'Overlays'
