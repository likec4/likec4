// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { createFileRoute, notFound } from '@tanstack/react-router'
import { loadDotSources } from 'likec4:dot'
import { ViewAsDot } from '../../pages/ViewAsDot'
import { relationshipExportSearchSchema } from '../../relationship-export'
import { loadRelationshipDotSource } from '../../relationship-source-route'

export const Route = createFileRoute('/project/$projectId/view/$viewId/dot')({
  component: Page,
  validateSearch: relationshipExportSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ params, context, deps }) => {
    const projectId = context.projectId
    const { viewId } = params
    try {
      const relationshipSource = await loadRelationshipDotSource(projectId, viewId, deps)
      if (relationshipSource) {
        return relationshipSource
      }
      const { dotSource, svgSource } = await loadDotSources(projectId)
      const dot = dotSource(viewId)
      const dotSvg = svgSource(viewId)
      return {
        dot,
        dotSvg,
      }
    } catch (error) {
      console.error(error)
      throw notFound()
    }
  },
})

function Page() {
  const { dot, dotSvg } = Route.useLoaderData()
  return <ViewAsDot dot={dot} dotSvg={dotSvg} />
}
