import { nonexhaustive } from '@likec4/core'
import { Box, Button, Code, Group, Notification, ScrollAreaAutosize } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useSelector } from '@xstate/react'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import { animate } from 'framer-motion/dom'
import { memo, useEffect, useMemo } from 'react'
import { type FallbackProps, ErrorBoundary } from 'react-error-boundary'
import { isNonNullish } from 'remeda'
import type { AnyActorRef } from 'xstate'
import { DiagramFeatures } from '../context'
import { useXYStore } from '../hooks'
import { ElementDetails } from './element-details/ElementDetails'
import { Overlay } from './overlay/Overlay'
import { type OverlaysActorRef, type OverlaysActorSnapshot } from './overlaysActor'
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

const selectOverlays = (s: OverlaysActorSnapshot) => {
  return s.context.overlays.map((overlay) => {
    switch (overlay.type) {
      case 'relationshipsBrowser':
        return s.children[overlay.id]
          ? {
            type: overlay.type,
            actorRef: s.children[overlay.id]!,
          }
          : null
      case 'relationshipDetails':
        return s.children[overlay.id]
          ? {
            type: overlay.type,
            actorRef: s.children[overlay.id]!,
          }
          : null
      case 'elementDetails':
        return s.children[overlay.id]
          ? {
            type: overlay.type,
            actorRef: s.children[overlay.id]!,
          }
          : null
      default:
        nonexhaustive(overlay)
    }
  }).filter(isNonNullish)
}
const compareSelectOverlays = <T extends ReturnType<typeof selectOverlays>>(a: T, b: T) => {
  return a.length === b.length && a.every((overlay, i) => {
    return overlay.actorRef === b[i]!.actorRef
  })
}

export const Overlays = memo(({ overlaysActorRef }: { overlaysActorRef: OverlaysActorRef }) => {
  const xyflowDomNode = useXYStore(s => s.domNode)
  const xyflowRendererDom = useMemo(() => xyflowDomNode?.querySelector('.react-flow__renderer') ?? null, [
    xyflowDomNode,
  ])
  const overlays = useSelector(overlaysActorRef, selectOverlays, compareSelectOverlays)
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

  const close = (actorRef: AnyActorRef) => {
    overlaysActorRef.send({ type: 'close', actorId: actorRef.id })
  }

  const overlaysReact = overlays.map((overlay) => {
    switch (overlay.type) {
      case 'relationshipsBrowser':
        return (
          <Overlay
            key={overlay.actorRef.sessionId}
            onClose={() => close(overlay.actorRef)}>
            <RelationshipsBrowser actorRef={overlay.actorRef} />
          </Overlay>
        )
      case 'relationshipDetails':
        return (
          <Overlay
            key={overlay.actorRef.sessionId}
            onClose={() => close(overlay.actorRef)}>
            <RelationshipDetails actorRef={overlay.actorRef} />
          </Overlay>
        )
      case 'elementDetails':
        return (
          <ElementDetails
            key={overlay.actorRef.sessionId}
            actorRef={overlay.actorRef}
            onClose={() => close(overlay.actorRef)} />
        )
      default:
        nonexhaustive(overlay)
    }
  })

  return (
    <DiagramFeatures.Overlays>
      <ErrorBoundary FallbackComponent={Fallback} onReset={() => overlaysActorRef.send({ type: 'close.all' })}>
        <AnimatePresence>
          {overlaysReact}
        </AnimatePresence>
      </ErrorBoundary>
    </DiagramFeatures.Overlays>
  )
})
Overlays.displayName = 'Overlays'
