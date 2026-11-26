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
  useLikeC4View,
  isLikeC4ViewId
} from 'likec4:model/${id}'
export const projectId = ${projectIdLiteral}
`
}

export const singleProjectModule: VirtualModule = {
  name: 'single-project',
  hmr: true,
  async load({ projects }) {
    const project = first(projects)
    logGenerating('single-project', project.id)
    return {
      code: code(project.id),
      moduleType: 'js',
    }
  },
}
