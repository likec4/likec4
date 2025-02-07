import { Box, Button, Code, Group, Notification } from '@mantine/core'
import { useCallbackRef } from '@mantine/hooks'
import { useLifecycleLogger } from '@react-hookz/web'
import { IconX } from '@tabler/icons-react'
import { deepEqual } from 'fast-equals'
import { useReducedMotion } from 'framer-motion'
import { animate } from 'framer-motion/dom'
import { memo, useEffect, useMemo } from 'react'
import { type FallbackProps, ErrorBoundary } from 'react-error-boundary'
import { DiagramFeatures } from '../context'
import { useXYStore } from '../hooks'
import { useDiagram } from '../hooks/useDiagram'
import { useDiagramActorState } from '../hooks/useDiagramActor'
import type { MachineSnapshot } from '../likec4diagram/state/machine'
import { ElementDetailsCard } from './element-details/ElementDetailsCard'
import { Overlay } from './overlay/Overlay'
import { RelationshipDetails } from './relationship-details/RelationshipDetails'
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
        <Code block>{errorString}</Code>
        <Group gap={'xs'} mt="xl">
          <Button color="gray" size="xs" variant="light" onClick={() => resetErrorBoundary()}>Reset</Button>
        </Group>
      </Notification>
    </Box>
  )
}

const selector = (s: MachineSnapshot) => ({
  relationshipsBrowserActor: s.children.relationshipsBrowser,
  relationshipDetailsActor: s.children.relationshipDetails,
  viewId: s.context.view.id,
  activeElementDetailsOf: s.context.activeElementDetails?.fqn ?? null,
  fromNode: s.context.activeElementDetails?.fromNode ?? null,
  rectFromNode: s.context.activeElementDetails?.nodeRectScreen ?? null,
})
const equals = (a: ReturnType<typeof selector>, b: ReturnType<typeof selector>) =>
  a.relationshipDetailsActor == b.relationshipDetailsActor &&
  a.relationshipsBrowserActor == b.relationshipsBrowserActor &&
  a.activeElementDetailsOf === b.activeElementDetailsOf &&
  a.viewId === b.viewId &&
  a.fromNode === b.fromNode &&
  deepEqual(a.rectFromNode, b.rectFromNode)

export const Overlays = memo(() => {
  const xyflowDomNode = useXYStore(s => s.domNode)
  const xyflowRendererDom = useMemo(() => xyflowDomNode?.querySelector('.react-flow__renderer') ?? null, [
    xyflowDomNode,
  ])
  const diagram = useDiagram()
  const {
    relationshipsBrowserActor,
    relationshipDetailsActor,
    activeElementDetailsOf,
    viewId,
    fromNode,
    rectFromNode,
  } = useDiagramActorState(selector, equals)

  useLifecycleLogger('Overlays', [relationshipsBrowserActor])

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

  const onClose = useCallbackRef(() => {
    diagram.closeOverlay()
    // relationshipsBrowserActor?.send({ type: 'close' })
    // relationshipDetailsActor?.send({ type: 'close' })
    // send({ type: 'close.overlay' })
  })

  return (
    <DiagramFeatures.Overlays>
      <ErrorBoundary FallbackComponent={Fallback} onReset={onClose}>
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
Overlays.displayName = 'Overlays'
