// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { nonexhaustive } from '@likec4/core'
import { useSelector } from '@xstate/react'
import { animate } from 'motion'
import { AnimatePresence, LayoutGroup, useReducedMotionConfig } from 'motion/react'
import { lazy, Suspense, useEffect } from 'react'
import { isNonNullish } from 'remeda'
import type { AnyActorRef } from 'xstate'
import { ErrorBoundary } from '../components/ErrorFallback'
import { DiagramFeatures } from '../context'
import { useDiagram } from '../hooks'
import { ElementDetails } from './element-details/ElementDetails'
import { Overlay } from './overlay/Overlay'
import type { OverlaysActorRef, OverlaysActorSnapshot } from './overlaysActor'
import { RelationshipDetails } from './relationship-details/RelationshipDetails'
import { RelationshipsBrowser } from './relationships-browser/RelationshipsBrowser'

const AIChat = lazy(() => import('../ai-chat/AIChat').then(m => ({ default: m.AIChat })))

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
      case 'aiChat':
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
  const diagram = useDiagram()

  const overlays = useSelector(overlaysActorRef, selectOverlays, compareSelectOverlays)
  const isMotionReduced = useReducedMotionConfig() ?? false

  const isActiveOverlay = overlays.some((overlay) => overlay.type === 'elementDetails' || overlay.type === 'aiChat')

  useEffect(() => {
    const xyflowDomNode = diagram.getContext().xystore.getState().domNode
    const xyflowRendererDom = xyflowDomNode?.querySelector<HTMLDivElement>('.react-flow__renderer')
    if (!xyflowRendererDom || isMotionReduced) return
    const current = animate(xyflowRendererDom, {
      opacity: isActiveOverlay ? 0.7 : 1,
      filter: isActiveOverlay ? 'grayscale(1)' : 'grayscale(0)',
      transform: isActiveOverlay ? `perspective(400px) translateZ(-12px) translateY(3px)` : `translateY(0)`,
    }, {
      duration: isActiveOverlay ? 0.35 : 0.17,
    })

    let cleanupTm: ReturnType<typeof setTimeout> | null = null
    if (!isActiveOverlay) {
      // Remove styles after animation when closing overlay
      // This improves performance by reducing number of layers being rendered
      cleanupTm = setTimeout(() => {
        xyflowRendererDom.style.transform = ''
        xyflowRendererDom.style.filter = ''
        cleanupTm = null
      }, 450)
    }

    return () => {
      if (cleanupTm) {
        clearTimeout(cleanupTm)
      }
      current.stop()
    }
  }, [isActiveOverlay])

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
      case 'aiChat':
        return (
          <Suspense key={overlay.actorRef.sessionId} fallback={null}>
            <AIChat
              actorRef={overlay.actorRef}
              onClose={() => close(overlay.actorRef)} />
          </Suspense>
        )
      default:
        nonexhaustive(overlay)
    }
  })

  return (
    <DiagramFeatures.Overlays>
      <ErrorBoundary onReset={() => overlaysActorRef.send({ type: 'close.all' })}>
        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            {overlaysReact}
          </AnimatePresence>
        </LayoutGroup>
      </ErrorBoundary>
    </DiagramFeatures.Overlays>
  )
}
