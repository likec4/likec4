// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { createFileRoute, notFound } from '@tanstack/react-router'
import { loadMmdSources } from 'likec4:mmd'
import { ViewAsMmd } from '../../pages/ViewAsMmd'
import { relationshipExportSearchSchema } from '../../relationship-export'
import { loadRelationshipTextSource } from '../../relationship-source-route'

export const Route = createFileRoute('/project/$projectId/view/$viewId/mmd')({
  component: Page,
  staleTime: Infinity,
  validateSearch: relationshipExportSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ params, context, deps }) => {
    const projectId = context.projectId
    const { viewId } = params
    try {
      const relationshipSource = await loadRelationshipTextSource('mmd', projectId, viewId, deps)
      if (relationshipSource) {
        return {
          source: relationshipSource,
        }
      }
      const { mmdSource } = await loadMmdSources(projectId)
      return {
        source: mmdSource(viewId),
      }
    } catch (error) {
      console.error(error)
      throw notFound()
    }
  },
})

function Page() {
  const { viewId } = Route.useParams()
  const { source } = Route.useLoaderData()
  return <ViewAsMmd viewId={viewId} mmdSource={source} />
}
