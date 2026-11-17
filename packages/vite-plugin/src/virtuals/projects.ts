// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { LikeC4ProjectConfig, RelationshipBrowserScope, WebappExportFormat } from '@likec4/config'
import type { NonEmptyArray } from '@likec4/core'
import JSON5 from 'json5'
import { map } from 'remeda'
import { logGenerating } from '../logger'
import type { VirtualModule } from './_shared'
import { effectiveWebappExportFormats } from './export-formats'

type ProjectData = {
  id: string
  title: string | undefined
  path: string
  contactPerson: string | undefined
  landingPage: LikeC4ProjectConfig['landingPage']
  relationshipBrowserDefaultScope: RelationshipBrowserScope
  exportFormats: WebappExportFormat[]
}

const code = (projects: NonEmptyArray<ProjectData>) => `
import { atom, computed, useStore, deepEqual } from 'likec4/vite-plugin/internal'

export const isSingleProject = ${projects.length === 1};
export let projects = ${JSON5.stringify(projects, null, 2)};

export const $projects = atom([...projects])
export const $projectIds = computed($projects, projects => projects.map(p => p.id))
$projectIds.eq = deepEqual

export function useLikeC4Projects() {
  return useStore($projects)
}

export function useLikeC4ProjectIds() {
  return useStore($projectIds)
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    import.meta.hot.data.$update ??= (newdata) => {
      projects.length = 0
      projects.push(...newdata)
      $projects.set(newdata)
    }
    const update = md.projects
    if (update) {
      import.meta.hot.data.$update(update)
    } else {
      import.meta.hot.invalidate()
    }
  })
}
`

export const projectsModule = {
  id: 'likec4:projects',
  virtualId: 'likec4:plugin/projects.js',
  async load({ projects }) {
    logGenerating('projects')
    return {
      code: code(map(projects, p => ({
        id: p.id,
        title: p.config.title ?? p.id,
        path: p.path,
        contactPerson: p.config.contactPerson,
        landingPage: p.config.landingPage,
        relationshipBrowserDefaultScope: p.config.webapp?.relationshipsBrowser?.defaultScope ?? 'view',
        exportFormats: effectiveWebappExportFormats(p.config),
      }))),
      moduleType: 'js',
    }
  },
} satisfies VirtualModule
