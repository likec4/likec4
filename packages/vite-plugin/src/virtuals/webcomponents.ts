import type { ProjectId } from '@likec4/core/types'
import { logGenerating } from '../logger'
import { type ProjectVirtualModule, generateMatches } from './_shared'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'

const jsStringLiteral = (value: string) => hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(value))

export const generateWebcomponentsCode = (projectId: ProjectId): string => {
  const projectIdLiteral = jsStringLiteral(projectId)
  const reactModuleLiteral = jsStringLiteral(`likec4:react/${projectId}`)

  return `
import { defineLikeC4Webcomponent } from 'likec4/react'
import { LikeC4View } from ${reactModuleLiteral}

export function defineWebcomponent(name) {
  return defineLikeC4Webcomponent(name, LikeC4View, ${projectIdLiteral})
}
`
}

export const projectWebcomponentsModule: ProjectVirtualModule = {
  ...generateMatches('webcomponents'),
  async load({ project }) {
    logGenerating('webcomponents', project.id)
    return {
      code: generateWebcomponentsCode(project.id),
      moduleType: 'js',
    }
  },
}
