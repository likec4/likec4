// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import * as z from 'zod/v4'
import { likec4Tool } from '../utils'
import { locationSchema, mkLocate, projectIdSchema } from './_common'

export const openView = likec4Tool({
  name: 'open-view',
  description:
    `Open a LikeC4 view in the editor's preview panel, replacing any open preview, and return its source location. Changes the editor, not the model.`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'Open view in preview panel',
  },
  inputSchema: {
    viewId: z.string().describe('View id (name)'),
    project: projectIdSchema,
  },
  outputSchema: {
    location: locationSchema,
  },
})(async (languageServices, args) => {
  const projectId = languageServices.projectsManager.ensureProjectId(args.project)
  const model = await languageServices.computedModel(projectId)
  const view = model.findView(args.viewId)

  if (!view) {
    throw new Error(`View with ID '${args.viewId}' not found in project ${projectId}`)
  }
  await languageServices.views.openView(view.id, projectId)

  const locate = mkLocate(languageServices, projectId)
  return {
    location: locate({ view: view.id }),
  }
})
