// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { BBox, ViewId } from '@likec4/core/types'
import { pickViewBounds, StaticLikeC4Diagram } from '@likec4/diagram'
import { useSearch } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { useCurrentProject, useCurrentView, useTransparentBackground } from '../hooks'
import { useRelationshipBrowserScope } from '../relationship-browser/scope'

export function EmbedPage() {
  const {
    padding = 20,
    dynamic,
  } = useSearch({
    strict: false,
  })
  const project = useCurrentProject()
  const [relationshipBrowserScope] = useRelationshipBrowserScope(project)
  const [diagram] = useCurrentView()
  const [contentBounds, setContentBounds] = useState<
    {
      viewId: string
      variant: typeof dynamic
      bounds: BBox
    } | null
  >(null)
  const onContentBoundsChange = useCallback(({ viewId, bounds }: { viewId: ViewId; bounds: BBox }) => {
    setContentBounds(previous =>
      previous?.viewId === viewId
        && previous.variant === dynamic
        && previous.bounds.x === bounds.x
        && previous.bounds.y === bounds.y
        && previous.bounds.width === bounds.width
        && previous.bounds.height === bounds.height
        ? previous
        : { viewId, variant: dynamic, bounds }
    )
  }, [dynamic])

  useTransparentBackground(!!diagram)

  if (!diagram) {
    return <div>Loading...</div>
  }

  const bounds = contentBounds?.viewId === diagram.id && contentBounds.variant === dynamic
    ? contentBounds.bounds
    : pickViewBounds(diagram, dynamic)

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        boxSizing: 'border-box',
        padding,
        transform: 'translateX(-50%)',
        aspectRatio: `${bounds.width + padding * 2} / ${bounds.height + padding * 2}`,
        width: '100vw',
        maxWidth: bounds.width + padding * 2,
        height: 'auto',
        maxHeight: '100vh',
      }}
    >
      <StaticLikeC4Diagram
        view={diagram}
        fitView={true}
        background={'transparent'}
        fitViewPadding={0}
        dynamicViewVariant={dynamic}
        enableNotes
        onContentBoundsChange={onContentBoundsChange}
        enableRelationshipDetails
        enableRelationshipBrowser
        relationshipBrowserScope={relationshipBrowserScope}
        initialWidth={bounds.width}
        initialHeight={bounds.height} />
    </div>
  )
}
