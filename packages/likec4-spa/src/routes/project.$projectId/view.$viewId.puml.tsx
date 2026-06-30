// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { createFileRoute, notFound } from '@tanstack/react-router'
import { loadPumlSources } from 'likec4:puml'
import { ViewAsPuml } from '../../pages/ViewAsPuml'
import { relationshipExportSearchSchema } from '../../relationship-export'
import { loadRelationshipTextSource } from '../../relationship-source-route'

export const Route = createFileRoute('/project/$projectId/view/$viewId/puml')({
  component: Page,
  staleTime: Infinity,
  validateSearch: relationshipExportSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ params, context, deps }) => {
    const projectId = context.projectId
    const { viewId } = params
    try {
      const relationshipSource = await loadRelationshipTextSource('puml', projectId, viewId, deps)
      if (relationshipSource) {
        return {
          source: relationshipSource,
        }
      }
      const { pumlSource } = await loadPumlSources(projectId)
      return {
        source: pumlSource(viewId),
      }
    } catch (error) {
      console.error(error)
      throw notFound()
    }
  },
})

function Page() {
  const { source } = Route.useLoaderData()
  return <ViewAsPuml pumlSource={source} />
}
