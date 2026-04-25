import { first } from 'remeda'
import { logGenerating } from '../logger'
import type { VirtualModule } from './_shared'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'

const code = (id: string) => {
  const projectIdLiteral = hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(id))
  return `
export { IconRenderer } from 'likec4:icons/${id}'
export {
  $likec4data,
  $likec4model,
  useLikeC4Model,
  useLikeC4Views,
  useLikeC4View
} from 'likec4:model/${id}'
export const projectId = ${projectIdLiteral}
`
}

export const singleProjectModule: VirtualModule = {
  id: 'likec4:single-project',
  virtualId: 'likec4:plugin/single-project.js',
  async load({ projects }) {
    const project = first(projects)
    logGenerating('single-project', project.id)
    return code(project.id)
  },
}
