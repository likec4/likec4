import { nonexhaustive } from '@likec4/core'
import { useSelector } from '@xstate/react'
import { animate } from 'motion'
import { AnimatePresence, LayoutGroup, useReducedMotionConfig } from 'motion/react'
import { useEffect, useMemo } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { isNonNullish } from 'remeda'
import type { AnyActorRef } from 'xstate'
import { ErrorFallback } from '../components/ErrorFallback'
import { DiagramFeatures } from '../context'
import { useXYStore } from '../hooks'
import { ElementDetails } from './element-details/ElementDetails'
import { Overlay } from './overlay/Overlay'
import { type OverlaysActorRef, type OverlaysActorSnapshot } from './overlaysActor'
import { RelationshipDetails } from './relationship-details/RelationshipDetails'
import { RelationshipsBrowser } from './relationships-browser/RelationshipsBrowser'

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

export function Overlays({ overlaysActorRef }: { overlaysActorRef: OverlaysActorRef }) {
  const xyflowDomNode = useXYStore(s => s.domNode)
  const xyflowRendererDom = useMemo(() => xyflowDomNode?.querySelector('.react-flow__renderer') ?? null, [
    xyflowDomNode,
  ])
  const overlays = useSelector(overlaysActorRef, selectOverlays, compareSelectOverlays)
  const isMotionReduced = useReducedMotionConfig() ?? false

  const isActiveOverlay = overlays.some((overlay) => overlay.type === 'elementDetails')

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

  const overlaysReact = overlays.map((overlay, index) => {
    switch (overlay.type) {
      case 'relationshipsBrowser':
        return (
          <Overlay
            key={overlay.actorRef.sessionId}
            overlayLevel={index}
            onClose={() => close(overlay.actorRef)}>
            <RelationshipsBrowser actorRef={overlay.actorRef} />
          </Overlay>
        )
      case 'relationshipDetails':
        return (
          <Overlay
            overlayLevel={index}
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
      <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => overlaysActorRef.send({ type: 'close.all' })}>
        <LayoutGroup>
          <AnimatePresence>
            {overlaysReact}
          </AnimatePresence>
        </LayoutGroup>
      </ErrorBoundary>
    </DiagramFeatures.Overlays>
  )
}
