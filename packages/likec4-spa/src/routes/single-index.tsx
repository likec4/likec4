// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { createFileRoute, notFound, stripSearchParams } from '@tanstack/react-router'
import { loadDiffs } from 'likec4:diffs'
import { loadModel } from 'likec4:model'
import { z } from 'zod'
import { ErrorComponent } from '../components/ErrorComponent'
import { ViewOutlet } from '../components/ViewOutlet'
import { LikeC4IconRendererContext } from '../context/LikeC4IconRendererContext'
import { LikeC4ModelContext } from '../context/LikeC4ModelContext'
import { ModelDiffsContext } from '../context/ModelDiffsContext'
import { ProjectIndexPage } from '../pages/ProjectIndex'

export const Route = createFileRoute('/single-index')({
  validateSearch: z.object({
    view: z.enum(['cards', 'table']).optional().catch('cards'),
  }),
  search: {
    middlewares: [
      stripSearchParams({
        view: 'cards',
      }),
    ],
  },
  staleTime: Infinity,
  loader: async ({ context }) => {
    const projectId = context.projectId
    const [data, { $diffs }] = await Promise.all([loadModel(projectId), loadDiffs(projectId)])
    const modelData = data.$likec4data.value
    if (!modelData) {
      throw notFound()
    }
    return {
      $likec4model: data.$likec4model,
      $diffs,
      projectId,
    }
  },
  component: RouteComponent,
  errorComponent: ErrorComponent,
})

function RouteComponent() {
  const { $likec4model, $diffs, projectId } = Route.useLoaderData()
  const mode = Route.useSearch({ select: s => s.view ?? 'cards' })
  const navigate = Route.useNavigate()
  return (
    <ViewOutlet>
      <LikeC4IconRendererContext projectId={projectId}>
        <LikeC4ModelContext likec4model={$likec4model}>
          <ModelDiffsContext diffs={$diffs}>
            <ProjectIndexPage
              mode={mode}
              onModeChange={next => {
                void navigate({ search: prev => ({ ...prev, view: next }), replace: true })
              }} />
          </ModelDiffsContext>
        </LikeC4ModelContext>
      </LikeC4IconRendererContext>
    </ViewOutlet>
  )
}
