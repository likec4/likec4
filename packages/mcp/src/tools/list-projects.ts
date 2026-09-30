// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import * as z from 'zod/v4'
import { likec4Tool } from '../utils'

export const listProjects = likec4Tool({
  name: 'list-projects',
  description:
    `List the LikeC4 projects in the workspace. Pass a project's id as the "project" argument of other tools.`,
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    title: 'List projects',
  },
  inputSchema: {},
  outputSchema: {
    projects: z.array(z.object({
      id: z.string(),
      title: z.string(),
      folder: z.string(),
      sources: z.array(z.string()),
    })),
  },
})(async (languageServices) => {
  const projects = languageServices.projects()
  return {
    projects: projects.map(p => ({
      id: p.id,
      title: p.title,
      folder: p.folder.fsPath,
      sources: p.documents.map(d => d.fsPath),
    })),
  }
})
