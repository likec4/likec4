// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { ProjectId, scalar } from '@likec4/core'
import { LikeC4Model } from '@likec4/core/model'
import { LikeC4Diagram, LikeC4EditorProvider, LikeC4ModelProvider, useLikeC4Model } from '@likec4/diagram'
import { Button, Overlay } from '@mantine/core'
import { memo, useMemo } from 'react'
import { only } from 'remeda'
import { likec4Container, likec4ParsingScreen } from '../App.css'
import { ErrorMessage } from '../QueryErrorBoundary'
import {
  openProjectsScreen,
  setLastClickedNode,
  setLayoutType,
  useComputedModelData,
  useDiagramView,
  useLikeC4EditorPort,
} from '../state'
import { ExtensionApi as extensionApi } from '../vscode'

export function ViewScreen() {
  const { error, model } = useComputedModelData()
  const editor = useLikeC4EditorPort()
  const likec4Model = useMemo(() => model ? LikeC4Model.create(model) : null, [model])
  if (!likec4Model) {
    return (
      <>
        <section>
          {error ? <ErrorMessage error={error} /> : <p>Parsing your model...</p>}
          <p>
            <Button color="gray" onClick={extensionApi.closeMe}>
              Close
            </Button>
          </p>
        </section>
      </>
    )
  }

  return (
    <LikeC4ModelProvider key={likec4Model.projectId} likec4model={likec4Model}>
      {error && <ErrorMessage error={error} />}
      <LikeC4EditorProvider editor={editor}>
        <LikeC4ViewMemo projectId={likec4Model.project.id} />
      </LikeC4EditorProvider>
    </LikeC4ModelProvider>
  )
}
const LikeC4ViewMemo = memo<{ projectId: ProjectId }>(({ projectId }) => {
  const model = useLikeC4Model()
  let {
    view,
    error,
  } = useDiagramView(projectId)

  if (!view) {
    return (
      <div className={likec4ParsingScreen}>
        {error && <ErrorMessage error={error} />}
        <section>
          <p>Parsing your model...</p>
          <p>
            <Button color="gray" onClick={extensionApi.closeMe}>
              Close
            </Button>
          </p>
        </section>
      </div>
    )
  }

  return (
    <>
      <div className={likec4Container} data-vscode-context='{"preventDefaultContextMenuItems": true}'>
        <LikeC4Diagram
          view={view}
          fitViewPadding={{
            top: '70px',
            bottom: '30px',
            left: '60px',
            right: '30px',
          }}
          controls
          enableFocusMode
          enableDynamicViewWalkthrough
          enableElementDetails
          enableRelationshipBrowser
          enableAIChat={!!model.project.aiChat && model.project.aiChat.enabled !== false}
          aiChatConfig={model.project.aiChat
            ? {
              ...model.project.aiChat,
              // Strip apiKey unless explicitly allowed to prevent leaking secrets in the webview
              ...(!model.project.aiChat.allowUnsafeApiKey && { apiKey: undefined }),
              customFetch: extensionApi.proxyFetch,
            }
            : undefined}
          enableElementTags
          enableSearch
          enableRelationshipDetails
          enableCompareWithLatest
          showNavigationButtons
          enableNotations
          onNavigateTo={(_to, event) => {
            const to = _to as scalar.ViewId
            setLastClickedNode()
            extensionApi.locate({ view: to, projectId })
            extensionApi.navigateTo(to, projectId)
            event?.stopPropagation()
          }}
          onNodeContextMenu={(element) => {
            setLastClickedNode(element)
          }}
          onCanvasContextMenu={event => {
            setLastClickedNode()
            event.stopPropagation()
            event.preventDefault()
          }}
          onEdgeClick={(edge) => {
            if (view._type === 'dynamic' && edge.astPath) {
              extensionApi.locate({
                projectId,
                view: view.id,
                astPath: edge.astPath,
              })
              return
            }
            const relationId = only(edge.relations)
            if (relationId) {
              extensionApi.locate({
                projectId,
                relation: relationId,
              })
            }
          }}
          onEdgeContextMenu={(edge, event) => {
            setLastClickedNode()
            event.stopPropagation()
            event.preventDefault()
          }}
          onOpenSource={(params) => {
            setLastClickedNode()
            extensionApi.locate({
              projectId,
              ...params,
            })
          }}
          onInitialized={() => {
            extensionApi.locate({
              projectId,
              view: view.id,
            })
          }}
          onLogoClick={openProjectsScreen}
          onLayoutTypeChange={setLayoutType}
        />
        {error && (
          <>
            <Overlay blur={2} backgroundOpacity={0.2} />
            <ErrorMessage error={error} />
          </>
        )}
      </div>
    </>
  )
})
