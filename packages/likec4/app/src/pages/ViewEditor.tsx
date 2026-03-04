// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { LikeC4Diagram, LikeC4EditorProvider, useLikeC4Model } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { likec4rpc } from 'likec4:rpc'
import { NotFound } from '../components/NotFound'
import { isDevelopment } from '../const'
import { useLikeC4ModelAtom } from '../context/safeCtx'
import { useCurrentProject, useCurrentView } from '../hooks'
import { ListenForDynamicVariantChange, OpenRelationshipBrowserFromUrl } from './ViewReact'

export function ViewEditor() {
  const navigate = useNavigate()
  const project = useCurrentProject()
  const [view, setLayoutType] = useCurrentView()
  const $likec4model = useLikeC4ModelAtom()
  const model = useLikeC4Model()
  const { dynamic } = useSearch({ strict: false })

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

  if (!view) {
    return <NotFound />
  }

  const notations = view.notation?.nodes ?? []
  const hasNotations = notations.length > 0

  return (
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
      }}>
      <LikeC4Diagram
        view={view}
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
        enableDynamicViewWalkthrough
        enableFocusMode
        enableElementDetails
        enableRelationshipDetails
        enableRelationshipBrowser
        enableAIChat={!!model.project.aiChat && model.project.aiChat.enabled !== false}
        aiChatConfig={model.project.aiChat}
        enableElementTags
        enableCompareWithLatest
        dynamicViewVariant={dynamic}
        onNavigateTo={onNavigateTo}
        onLayoutTypeChange={setLayoutType}
        onLogoClick={() => {
          void navigate({
            to: '/',
          })
        }}
      >
        <ListenForDynamicVariantChange />
        <OpenRelationshipBrowserFromUrl />
      </LikeC4Diagram>
    </LikeC4EditorProvider>
  )
}
