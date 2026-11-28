// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { LikeC4Diagram, LikeC4EditorProvider } from '@likec4/diagram'
import { openSourceInEditor } from '@likec4/vite-plugin/internal'
import { useCallbackRef } from '@mantine/hooks'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { isDevelopment } from 'likec4:app-config'
import { isAIAvailable, likec4rpc } from 'likec4:rpc'
import { LazyAIChat } from '../aichat'
import { CompareModelProvider } from '../components/model-diff/CompareModelProvider'
import { ModelDiffPanel, useCompareView, useSelectOwnerDiff } from '../components/model-diff/ModelDiffPanel'
import { NotFound } from '../components/NotFound'
import { useLikeC4ProjectContext } from '../context/safeCtx'
import { useCurrentProject, useCurrentView, useCurrentViewId, useModelDiffs } from '../hooks'
import { useRelationshipBrowserScope } from '../relationship-browser/scope'
import { FocusElementFromUrl, ListenForDiagramStateChanges, OpenRelationshipBrowserFromUrl } from './ViewReact'

export function ViewEditor() {
  const navigate = useNavigate()
  const project = useCurrentProject()
  const viewId = useCurrentViewId()
  const [view, setLayoutType] = useCurrentView()
  const [relationshipBrowserScope, setRelationshipBrowserScope] = useRelationshipBrowserScope(project)
  const { $model: $likec4model } = useLikeC4ProjectContext()
  const { dynamic } = useSearch({ strict: false })
  const { diffs } = useModelDiffs()
  const compareView = useCompareView(viewId)
  useSelectOwnerDiff(!!view, viewId)

  const onNavigateTo = useCallbackRef((viewId: string) => {
    void navigate({
      to: './',
      viewTransition: false,
      params: (current: any) => ({
        ...current,
        viewId,
      }),
      search: true,
    })
  })

  // A view that only a diff introduces has no saved view, just the compare view
  const shown = compareView ?? view
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
  // The compare view is not the saved view: keep the editor off
  const isComparing = compareView !== null

  const diagram = (
    <LikeC4Diagram
      view={shown}
      zoomable
      pannable
      controls
      fitViewPadding={{
        top: '70px',
        bottom: '32px',
        left: '50px',
        right: '32px',
      }}
      showNavigationButtons
      enableNotations={isDevelopment || hasNotations}
      enableSearch
      enableDynamicViewWalkthrough={!isComparing}
      enableFocusMode
      enableElementDetails
      enableRelationshipDetails
      enableRelationshipBrowser
      relationshipBrowserScope={relationshipBrowserScope}
      onRelationshipBrowserScopeChange={setRelationshipBrowserScope}
      enableElementTags
      enableCompareWithLatest={!isComparing}
      dynamicViewVariant={dynamic}
      onNavigateTo={onNavigateTo}
      onOpenSource={(params) => openSourceInEditor({ ...params, projectId: project.id })}
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
      <LazyAIChat />
    </LikeC4Diagram>
  )

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <CompareModelProvider viewId={shown.id}>
        {isComparing ? diagram : (
          <LikeC4EditorProvider
            editor={{
              fetchView: (id, layout) => {
                const model = $likec4model.get().view(id)
                return layout === 'auto' ? model.$view : model.$layouted
              },
              handleChange: (viewId, change) => {
                const event = {
                  projectId: project.id,
                  viewId,
                  change,
                }
                return likec4rpc.updateView(event)
              },
              ...(isAIAvailable && {
                applySemanticLayout: (viewId) => {
                  return likec4rpc.applySemanticLayout({
                    projectId: project.id,
                    viewId,
                  })
                },
              }),
            }}>
            {diagram}
          </LikeC4EditorProvider>
        )}
      </CompareModelProvider>
      <ModelDiffPanel viewId={shown.id} />
    </div>
  )
}
