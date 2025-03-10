import { invariant } from '@likec4/core'
import { first, only } from 'remeda'
import { type VirtualModule, k } from './_shared'

const code = (id: string) => `
export { IconRenderer } from 'virtual:likec4/${id}/icons'
export {
  $likec4data,
  $likec4model
} from 'virtual:likec4/${id}/model'
export const projectId = ${JSON.stringify(id)}
`

export const singleProjectModule = {
  id: 'virtual:likec4/single-project',
  virtualId: '\0likec4-plugin/single-project.js',
  async load({ likec4, logger, projects, assetsDir }) {
    const project = first(projects)
    logger.info(k.dim('generating virtual:likec4/single-project for') + ' ' + project.id)
    return code(project.id)
  },
} satisfies VirtualModule
