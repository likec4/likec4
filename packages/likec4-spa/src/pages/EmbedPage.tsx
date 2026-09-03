// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { pickViewBounds, StaticLikeC4Diagram } from '@likec4/diagram'
import { useSearch } from '@tanstack/react-router'
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

  useTransparentBackground(!!diagram)

  if (!diagram) {
    return <div>Loading...</div>
  }

  const bounds = pickViewBounds(diagram, dynamic)

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
        enableRelationshipDetails
        enableRelationshipBrowser
        relationshipBrowserScope={relationshipBrowserScope}
        initialWidth={bounds.width}
        initialHeight={bounds.height} />
    </div>
  )
}
