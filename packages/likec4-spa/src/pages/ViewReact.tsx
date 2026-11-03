// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { RelationshipBrowserScope } from '@likec4/config'
import type { Fqn } from '@likec4/core'
import {
  LikeC4Diagram,
  selectDiagramContext,
  useDiagram,
  useDiagramSelector,
  useLikeC4Model,
  useOnDiagramEvent,
  useUpdateEffect,
} from '@likec4/diagram'
import { useCallbackRef, useDocumentTitle } from '@mantine/hooks'
import { useIsMounted, useUnmountEffect } from '@react-hookz/web'
import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { pageTitle as defaultPageTitle } from 'likec4:app-config'
import { useEffect, useRef } from 'react'
import { CompareModelProvider } from '../components/model-diff/CompareModelProvider'
import { ModelDiffPanel, useCompareView } from '../components/model-diff/ModelDiffPanel'
import { selectDiff, useModelDiffState } from '../components/model-diff/state'
import { NotFound } from '../components/NotFound'
import { headerOps } from '../components/view-page/state'
import { useModelDiffs } from '../context/ModelDiffsContext'
import { useCurrentProject, useCurrentView, useCurrentViewId } from '../hooks'
import { useRelationshipBrowserScope } from '../relationship-browser/scope'

export function ViewReact() {
  const navigate = useNavigate()
  const project = useCurrentProject()
  const viewId = useCurrentViewId()
  const [view, setLayoutType] = useCurrentView()
  const [relationshipBrowserScope, setRelationshipBrowserScope] = useRelationshipBrowserScope(project)
  const model = useLikeC4Model()
  const { dynamic, diff: diffParam } = useSearch({
    from: '__root__',
  })
  const { diffs } = useModelDiffs()
  const { diffId } = useModelDiffState()
  const compareView = useCompareView(viewId)

  useEffect(() => {
    if (view || diffParam || diffId) {
      return
    }
    const owners = diffs.filter(diff => diff.views.some(item => item.id === viewId))
    const owner = owners.length === 1 ? owners[0] : undefined
    if (!owner) {
      return
    }
    selectDiff(owner.id)
    void navigate({
      to: './',
      replace: true,
      search: (prev) => ({ ...prev, diff: owner.id }),
    })
  }, [view, diffParam, diffId, diffs, viewId, navigate])

  const onNavigateTo = useCallbackRef((viewId: string) => {
    void navigate({
      to: './',
      viewTransition: false,
      params: (current) => ({
        ...current,
        viewId,
      }),
      search: true,
    })
  })

  const shown = compareView ?? view
  const title = shown ? (shown.title ?? shown.id) : `View not found`
  const pageTitle = model.project.title ?? defaultPageTitle
  useDocumentTitle(`${title} - ${pageTitle}`)

  if (!shown) {
    const owners = diffs.filter(diff => diff.views.some(item => item.id === viewId))
    if (owners.length === 0) {
      return <NotFound />
    }
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <ModelDiffPanel viewId={viewId} />
      </div>
    )
  }

  const notations = shown.notation?.nodes ?? []
  const hasNotations = notations.length > 0
  const isComparing = compareView !== null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <CompareModelProvider viewId={shown.id}>
        <LikeC4Diagram
          view={shown}
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
          enableDynamicViewWalkthrough={!isComparing}
          dynamicViewVariant={dynamic}
          enableElementDetails
          enableRelationshipDetails
          enableRelationshipBrowser
          relationshipBrowserScope={relationshipBrowserScope}
          onRelationshipBrowserScopeChange={setRelationshipBrowserScope}
          enableElementTags
          enableCompareWithLatest={!isComparing}
          enableNotations={hasNotations}
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
          <OpenRelationshipBrowserFromUrl relationshipBrowserScope={relationshipBrowserScope} />
          <FocusElementFromUrl />
        </LikeC4Diagram>
      </CompareModelProvider>
      <ModelDiffPanel viewId={shown.id} />
    </div>
  )
}

/**
 * Opens Relationship Browser when `?relationships={elementFqn}` URL parameter is present.
 * Handles both initial load and parameter changes during navigation.
 * Clears the URL parameters after opening to prevent reopening on navigation.
 */
export function OpenRelationshipBrowserFromUrl({
  relationshipBrowserScope,
}: {
  relationshipBrowserScope: RelationshipBrowserScope
}) {
  const router = useRouter()
  const diagram = useDiagram()
  const { relationships, relationshipsScope } = useSearch({
    from: '__root__',
  })
  const processedRef = useRef<string | null>(null)
  const isInitializedRef = useRef(false)
  const isProcessingRef = useRef(Promise.resolve())
  const isMounted = useIsMounted()

  const openAndClear = (fqn: Fqn) => {
    const scope = relationshipsScope ?? relationshipBrowserScope
    const requestKey = `${fqn}:${scope}`
    isProcessingRef.current = isProcessingRef.current.then(async () => {
      if (!isMounted() || processedRef.current === requestKey) return
      try {
        processedRef.current = requestKey
        diagram.openRelationshipsBrowser(fqn, scope)
        await router.buildAndCommitLocation({
          search: (s: Record<string, unknown>) => {
            const { relationships: _, relationshipsScope: __, ...rest } = s
            return rest
          },
          replace: true,
          viewTransition: false,
        })
      } catch (error) {
        console.error('Failed to open relationship browser:', error)
      }
    })
  }

  const process = () => {
    if (!relationships) {
      processedRef.current = null
      return
    }
    const scope = relationshipsScope ?? relationshipBrowserScope
    const requestKey = `${relationships}:${scope}`
    if (processedRef.current !== requestKey) {
      void openAndClear(relationships)
    }
  }

  useOnDiagramEvent('initialized', () => {
    isInitializedRef.current = true
    process()
  })

  // Handle parameter changes after initialization
  useUpdateEffect(() => {
    process()
  }, [relationships, relationshipsScope])

  return null
}

/**
 * Focuses on an element when `?focusOnElement={elementFqn}` URL parameter is present.
 * Used when navigating from the overview search with an element target.
 * Clears the parameter after focusing to prevent refocusing on navigation.
 */
export function FocusElementFromUrl() {
  const router = useRouter()
  const diagram = useDiagram()
  const { focusOnElement } = useSearch({
    from: '__root__',
  })
  const processedRef = useRef<Fqn | null>(null)

  const focusAndClear = useCallbackRef((fqn: Fqn) => {
    try {
      if (processedRef.current === fqn) return
      processedRef.current = fqn
      diagram.focusOnElement(fqn)
      void router.buildAndCommitLocation({
        search: (s: Record<string, unknown>) => {
          const { focusOnElement: _, ...rest } = s
          return rest
        },
        replace: true,
        viewTransition: false,
      })
    } catch (error) {
      console.error('focusOnElement failed:', error)
    }
  })

  useOnDiagramEvent('initialized', () => {
    if (focusOnElement && processedRef.current !== focusOnElement) {
      focusAndClear(focusOnElement)
    }
  })

  useUpdateEffect(() => {
    if (!focusOnElement) {
      processedRef.current = null
    }
  }, [focusOnElement])

  return null
}

const selectDiagramState = selectDiagramContext((c) => ({
  dynamicViewVariant: c.dynamicViewVariant,
  isWalkthroughActive: !!c.activeWalkthrough,
}))
export function ListenForDiagramStateChanges() {
  const router = useRouter()
  const { dynamicViewVariant, isWalkthroughActive } = useDiagramSelector(selectDiagramState)

  useUpdateEffect(() => {
    const search = router.latestLocation.search.dynamic ?? 'diagram'
    if (search !== dynamicViewVariant) {
      void router.buildAndCommitLocation({
        search: (current: Record<string, unknown>) => ({
          ...current,
          dynamic: dynamicViewVariant,
        }),
        viewTransition: false,
      })
    }
  }, [dynamicViewVariant])

  useEffect(() => {
    headerOps.toggle(!isWalkthroughActive)
  }, [isWalkthroughActive])

  useUnmountEffect(() => {
    headerOps.show()
  })

  return null
}
