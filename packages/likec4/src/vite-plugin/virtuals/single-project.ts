import { first } from 'remeda'
import { type VirtualModule, k } from './_shared'

const code = (id: string) => `
export { IconRenderer } from 'likec4:icons/${id}'
export {
  $likec4data,
  $likec4model,
  useLikeC4Model,
  useLikeC4Views,
  useLikeC4View
} from 'likec4:model/${id}'
export const projectId = ${JSON.stringify(id)}
`

export const singleProjectModule = {
  id: 'likec4:single-project',
  virtualId: 'likec4:plugin/single-project.js',
  async load({ likec4, logger, projects, assetsDir }) {
    const project = first(projects)
    logger.info(k.dim('generating likec4:single-project for') + ' ' + project.id)
    return code(project.id)
  },
} satisfies VirtualModule
