import type { NonEmptyArray } from '@likec4/core'
import JSON5 from 'json5'
import { map, pick } from 'remeda'
import { type VirtualModule, k } from './_shared'

const code = (projects: NonEmptyArray<{ id: string; title?: string }>) => `
export const isSingleProject = ${projects.length === 1};
export const projects = ${JSON5.stringify(projects, null, 2)};
`

export const projectsModule = {
  id: 'likec4:projects',
  virtualId: 'likec4:plugin/projects.js',
  async load({ logger, projects }) {
    logger.info(k.dim('generating likec4:projects'))
    return code(map(projects, pick(['id', 'title'])))
  },
} satisfies VirtualModule
