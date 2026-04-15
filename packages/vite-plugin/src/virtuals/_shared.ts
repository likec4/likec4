import type { LikeC4ProjectConfig } from '@likec4/config'
import type { LikeC4Project, NonEmptyArray, ProjectId } from '@likec4/core'
import type { LikeC4LanguageServices } from '@likec4/language-server'
import type { URI } from 'langium'
import k from 'tinyrainbow'
import { joinURL } from 'ufo'
import { type ViteLogger, logGenerating } from '../logger'
import { hardenJsonStringLiteralForEmbeddedScript } from './hardenJsonStringLiteralForEmbeddedScript'

export { k }

export type VirtualModuleProject = LikeC4Project & {
  folder: URI
  config: Readonly<LikeC4ProjectConfig>
}

export interface VirtualModule {
  id: string
  virtualId: string
  load(opts: {
    logger: ViteLogger
    likec4: LikeC4LanguageServices
    projects: NonEmptyArray<VirtualModuleProject>
    assetsDir: string
  }): Promise<string>
}

/**
 * Project scoped virtual module
 */
export interface ProjectVirtualModule {
  matches: (id: string) => ProjectId | null
  virtualId: (projectId: ProjectId) => string
  load(opts: {
    logger: ViteLogger
    likec4: LikeC4LanguageServices
    project: VirtualModuleProject
    assetsDir: string
  }): Promise<string>
}

export function generateMatches(moduleId: string, extension = '.js') {
  return {
    matches: (id: string): ProjectId | null => {
      let { module, projectId } = id.match(/^likec4:plugin\/(?<projectId>.+)\/(?<module>.+)$/)?.groups ??
        id.match(/^likec4:(?<module>.+)\/(?<projectId>.+)$/)?.groups ?? {}
      if (!module || !projectId) {
        return null
      }
      if (module.endsWith(extension)) {
        module = module.slice(0, -extension.length)
      }
      if (module === moduleId) {
        return projectId as ProjectId
      }
      return null
    },
    virtualId: (projectId: ProjectId): string => joinURL(`likec4:plugin`, projectId, moduleId) + extension,
  }
}

export function generateCombinedProjects(moduleId: string, fnName: string): VirtualModule {
  return {
    id: `likec4:${moduleId}`,
    virtualId: 'likec4:plugin/' + moduleId + '.js',
    async load({ projects }) {
      logGenerating(moduleId)

      const cases = projects.map(({ id }) => {
        const idLiteral = hardenJsonStringLiteralForEmbeddedScript(JSON.stringify(id))
        const pkgLiteral = hardenJsonStringLiteralForEmbeddedScript(
          JSON.stringify(joinURL(`likec4:${moduleId}`, id)),
        )
        return `${idLiteral}: () => import(${pkgLiteral})`
      })

      return `
export let ${fnName}Fn = {
${cases.join(',\n')}
}      

export async function ${fnName}(projectId) {
  let fn = ${fnName}Fn[projectId]
  if (!fn) {
    const projects = Object.keys(${fnName}Fn)
    console.error('Unknown projectId: ' + projectId + ' (available: ' + projects + ')')
    if (projects.length === 0) {
      throw new Error('No projects found, invalid state')
    }
    projectId = projects[0]
    console.warn('Falling back to project: ' + projectId)
    fn = ${fnName}Fn[projectId]
  }
  return await fn()
}

if (import.meta.hot) {
  import.meta.hot.accept(md => {
    if (!import.meta.hot.data.$update) {
      import.meta.hot.data.$update = ${fnName}Fn
    }
    const update = md.${fnName}Fn
    if (update) {
      Object.assign(import.meta.hot.data.$update, update)
    } else {
      import.meta.hot.invalidate()
    }
  })
}
    `
    },
  }
}
