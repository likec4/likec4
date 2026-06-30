// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { useRerender } from '@react-hookz/web'
import { type ReactNode, memo, useCallback } from 'react'
import { ErrorBoundary } from '../components/ErrorFallback'
import { useEnabledFeatures } from '../context/DiagramFeatures'
import { selectDiagramActor, useDiagramSnapshot } from '../hooks/useDiagram'
import type { RelationshipBrowserActionProps } from '../LikeC4Diagram.props'
import { NavigationPanel } from '../navigationpanel'
import { Overlays } from '../overlays/Overlays'
import { Search } from '../search/Search'
import { RelationshipPopover } from './relationship-popover/RelationshipPopover'
import { LayoutDriftFrame, NotationPanel } from './ui'

const selectChildren = selectDiagramActor(s => ({
  overlays: s.children.overlays ?? null,
  search: s.children.search ?? null,
}))

export const LikeC4DiagramUI = memo(({
  renderRelationshipBrowserActions,
}: {
  renderRelationshipBrowserActions?: ((props: RelationshipBrowserActionProps) => ReactNode) | undefined
}) => {
  const {
    enableControls,
    enableNotations,
    enableSearch,
    enableRelationshipDetails,
    enableReadOnly,
    enableCompareWithLatest,
  } = useEnabledFeatures()
  const rerender = useRerender()
  const actors = useDiagramSnapshot(selectChildren)

  const handleReset = useCallback(() => {
    console.warn('DiagramUI: resetting error boundary and rerendering...')
    rerender()
  }, [])

  return (
    <ErrorBoundary onReset={handleReset}>
      {enableControls && <NavigationPanel />}
      {actors.overlays && (
        <Overlays
          overlaysActorRef={actors.overlays}
          renderRelationshipBrowserActions={renderRelationshipBrowserActions} />
      )}
      {enableNotations && <NotationPanel />}
      {enableSearch && actors.search && <Search searchActorRef={actors.search} />}
      {enableRelationshipDetails && enableReadOnly && <RelationshipPopover />}
      {enableCompareWithLatest && <LayoutDriftFrame />}
    </ErrorBoundary>
  )
})
LikeC4DiagramUI.displayName = 'DiagramUI'
