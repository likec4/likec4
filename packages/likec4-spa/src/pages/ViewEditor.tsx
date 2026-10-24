// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { LikeC4Diagram, LikeC4EditorProvider } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { isDevelopment } from 'likec4:app-config'
import { isAIAvailable, likec4rpc } from 'likec4:rpc'
import { LazyAIChat } from '../aichat'
import { ModelDiffPanel, useCompareView } from '../components/model-diff/ModelDiffPanel'
import { NotFound } from '../components/NotFound'
import { useLikeC4ModelAtom } from '../context/safeCtx'
import { useCurrentProject, useCurrentView } from '../hooks'
import { useRelationshipBrowserScope } from '../relationship-browser/scope'
import { FocusElementFromUrl, ListenForDiagramStateChanges, OpenRelationshipBrowserFromUrl } from './ViewReact'

export function ViewEditor() {
  const navigate = useNavigate()
  const project = useCurrentProject()
  const [view, setLayoutType] = useCurrentView()
  const [relationshipBrowserScope, setRelationshipBrowserScope] = useRelationshipBrowserScope(project)
  const $likec4model = useLikeC4ModelAtom()
  const { dynamic } = useSearch({ strict: false })
  const compareView = useCompareView(view?.id)

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

  if (!view) {
    return <NotFound />
  }

  const notations = view.notation?.nodes ?? []
  const hasNotations = notations.length > 0
  // Compare views contain elements that are not in the model: no editing, no model overlays
  const isComparing = compareView !== null

  const diagram = (
    <LikeC4Diagram
      view={compareView ?? view}
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
      enableElementDetails={!isComparing}
      enableRelationshipDetails={!isComparing}
      enableRelationshipBrowser={!isComparing}
      relationshipBrowserScope={relationshipBrowserScope}
      onRelationshipBrowserScopeChange={setRelationshipBrowserScope}
      enableElementTags
      enableCompareWithLatest={!isComparing}
      dynamicViewVariant={dynamic}
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
      <LazyAIChat />
    </LikeC4Diagram>
  )

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
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
      <ModelDiffPanel viewId={view.id} />
    </div>
  )
}
