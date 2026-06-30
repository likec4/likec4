// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { createFileRoute, notFound } from '@tanstack/react-router'
import { loadD2Sources } from 'likec4:d2'
import { ViewAsD2 } from '../../pages/ViewAsD2'
import { relationshipExportSearchSchema } from '../../relationship-export'
import { loadRelationshipTextSource } from '../../relationship-source-route'

export const Route = createFileRoute('/_single/view/$viewId/d2')({
  component: Page,
  staleTime: Infinity,
  validateSearch: relationshipExportSearchSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, params, deps }) => {
    const projectId = context.projectId
    const { viewId } = params
    try {
      const relationshipSource = await loadRelationshipTextSource('d2', projectId, viewId, deps)
      if (relationshipSource) {
        return {
          source: relationshipSource,
        }
      }
      const { d2Source } = await loadD2Sources(projectId)
      return {
        source: d2Source(viewId),
      }
    } catch (error) {
      console.error(error)
      throw notFound()
    }
  },
})

function Page() {
  const { source } = Route.useLoaderData()
  return <ViewAsD2 d2Source={source} />
}
