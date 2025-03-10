import type { NonEmptyArray } from '@likec4/core'
import JSON5 from 'json5'
import { map, prop } from 'remeda'
import { type VirtualModule, k } from './_shared'

const code = (projects: NonEmptyArray<string>) => `
export const isSingleProject = ${projects.length === 1};
export const projects = ${JSON5.stringify(projects, null, 2)};
`

export const projectsModule = {
  id: 'virtual:likec4/projects',
  virtualId: '\0likec4-plugin/projects.js',
  async load({ likec4, logger, projects, assetsDir }) {
    logger.info(k.dim('generating virtual:likec4/projects'))
    return code(map(projects, prop('id')))
  },
} satisfies VirtualModule
