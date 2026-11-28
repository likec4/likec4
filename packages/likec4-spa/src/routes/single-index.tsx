// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { createFileRoute, notFound, stripSearchParams } from '@tanstack/react-router'
import { loadDiffs } from 'likec4:diffs'
import { loadProjectIcons } from 'likec4:icons'
import { loadModel } from 'likec4:model'
import { z } from 'zod'
import { ErrorComponent } from '../components/ErrorComponent'
import { ViewOutlet } from '../components/ViewOutlet'
import { LikeC4ProjectContext } from '../context/LikeC4ProjectContext'
import { ProjectIndexPage } from '../pages/ProjectIndex'

export const Route = createFileRoute('/single-index')({
  validateSearch: z.object({
    section: z.enum(['views', 'elements']).optional().catch('views'),
    view: z.enum(['cards', 'table']).optional().catch('cards'),
  }),
  search: {
    middlewares: [
      stripSearchParams({
        section: 'views',
        view: 'cards',
      }),
    ],
  },
  staleTime: Infinity,
  loader: async ({ context }) => {
    const projectId = context.projectId
    const [data, { $diffs }, IconRenderer] = await Promise.all([
      loadModel(projectId),
      loadDiffs(projectId),
      loadProjectIcons(projectId),
    ])
    const modelData = data.$likec4data.value
    if (!modelData) {
      throw notFound()
    }
    return {
      $likec4model: data.$likec4model,
      $diffs,
      IconRenderer,
      projectId,
    }
  },
  component: RouteComponent,
  errorComponent: ErrorComponent,
})

function RouteComponent() {
  const { $likec4model, $diffs, IconRenderer, projectId } = Route.useLoaderData()
  const section = Route.useSearch({ select: s => s.section ?? 'views' })
  const mode = Route.useSearch({ select: s => s.view ?? 'cards' })
  const navigate = Route.useNavigate()
  return (
    <ViewOutlet>
      <LikeC4ProjectContext projectId={projectId} $model={$likec4model} $diffs={$diffs} IconRenderer={IconRenderer}>
        <ProjectIndexPage
          section={section}
          onSectionChange={next => {
            void navigate({ search: prev => ({ ...prev, section: next }), replace: true })
          }}
          mode={mode}
          onModeChange={next => {
            void navigate({ search: prev => ({ ...prev, view: next }), replace: true })
          }} />
      </LikeC4ProjectContext>
    </ViewOutlet>
  )
}
