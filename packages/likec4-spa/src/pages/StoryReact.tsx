// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { positionsOf, resolveScene } from '@likec4/core'
import type { LayoutedView } from '@likec4/core/types'
import { LikeC4Diagram, useLikeC4Model } from '@likec4/diagram'
import { useCallbackRef, useDocumentTitle } from '@mantine/hooks'
import { useNavigate, useParams } from '@tanstack/react-router'
import { pageTitle as defaultPageTitle } from 'likec4:app-config'
import { useEffect, useRef, useState } from 'react'
import { NotFound } from '../components/NotFound'
import { useCurrentStory, useCurrentView } from '../hooks'
import { FocusElementFromUrl, ListenForDiagramStateChanges, OpenRelationshipBrowserFromUrl } from './ViewReact'

/**
 * Renders the scene view currently addressed by the route (`$viewId`),
 * aligned against whatever scene was previously on screen (per `resolveScene`,
 * `@likec4/core`), and wires `onNavigateTo` to decide nested-vs-flat routing:
 * a target that is itself a scene of this story stays nested under
 * `/story/$storyId/view/$viewId`; anything else falls back to the flat
 * `/view/$viewId` route.
 *
 * A story owns no geometry and no view rules (RFC 0001) — there is nothing to
 * edit, so unlike `ViewReact`/`ViewEditor` there is no separate editor
 * variant; this component is used unconditionally, in dev and prod alike.
 */
export function StoryReact() {
  const navigate = useNavigate()
  const { storyId } = useParams({ from: '/project/$projectId/story/$storyId/view/$viewId' })
  const story = useCurrentStory()
  const [view, setLayoutType] = useCurrentView()
  const model = useLikeC4Model()

  // Tracks the last-rendered scene's view, to align the next scene against it
  // (`resolveScene`'s `outgoing`). Reset to `null` when the story changes —
  // a fresh story session has nothing to align against. Mirrors the ref the
  // deleted `StoryCursorSync` actor used to keep, now keyed off the route
  // instead of actor-cursor changes.
  const previousRef = useRef<LayoutedView | null>(null)
  const [previousStoryId, setPreviousStoryId] = useState(storyId)
  if (storyId !== previousStoryId) {
    setPreviousStoryId(storyId)
    previousRef.current = null
  }

  const currentScene = story && view ? story.scenes.find(s => s.view === view.id) : undefined
  const resolved = currentScene
    ? resolveScene({
      scene: currentScene,
      model,
      outgoing: previousRef.current ? positionsOf(previousRef.current) : new Map(),
      // `sceneLayout` is only optional on a still-parsed story (RFC 0001); a
      // story with `.scenes` is always computed/layouted, where it's
      // required — `?? 'anchored'` mirrors the same default `compute.ts`
      // applies when the DSL author omits it.
      sceneLayout: story!.sceneLayout ?? 'anchored',
    })
    : null
  const resolvedView = resolved?.view ?? view

  // Commit the just-rendered view as the alignment target for the *next*
  // scene, after render — never during render, which would make this
  // component's output depend on how many times React happens to invoke it
  // (StrictMode double-invokes render bodies in dev).
  useEffect(() => {
    previousRef.current = resolvedView
  }, [resolvedView])

  const onNavigateTo = useCallbackRef((targetViewId: string) => {
    const isOwnScene = story?.scenes.some(s => s.view === targetViewId) ?? false
    if (isOwnScene) {
      // Same route, new `$viewId` — mirrors `ViewReact`'s own `onNavigateTo`.
      void navigate({
        to: './',
        viewTransition: false,
        params: (current: any) => ({ ...current, viewId: targetViewId }),
        search: true,
      })
    } else {
      // Target isn't one of this story's scenes — drop to the flat view route.
      void navigate({
        to: '/project/$projectId/view/$viewId/',
        viewTransition: false,
        params: (current: any) => ({ projectId: current.projectId, viewId: targetViewId }),
        search: true,
      })
    }
  })

  const title = story ? (story.title ?? story.id) : `Story not found`
  const pageTitle = model.project.title ?? defaultPageTitle
  useDocumentTitle(`${title} - ${pageTitle}`)

  if (!story || !view || !resolvedView) {
    return <NotFound />
  }

  return (
    <LikeC4Diagram
      view={resolvedView}
      story={story.$view}
      zoomable
      pannable
      controls
      fitViewPadding={{
        top: '70px',
        bottom: '32px',
        left: '32px',
        right: '32px',
      }}
      showNavigationButtons
      enableSearch
      enableFocusMode
      enableStoryWalkthrough
      enableElementDetails
      enableRelationshipDetails
      enableRelationshipBrowser
      enableElementTags
      enableCompareWithLatest
      nodesSelectable
      onNavigateTo={onNavigateTo}
      onLayoutTypeChange={setLayoutType}
      onLogoClick={() => {
        void navigate({
          to: '/',
        })
      }}
    >
      <ListenForDiagramStateChanges />
      <OpenRelationshipBrowserFromUrl />
      <FocusElementFromUrl />
    </LikeC4Diagram>
  )
}
