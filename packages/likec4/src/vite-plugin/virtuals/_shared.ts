import type { NonEmptyArray, ProjectId } from '@likec4/core'
import type { LikeC4LanguageServices } from '@likec4/language-server'
import type { URI } from 'langium'
import k from 'tinyrainbow'
import { joinURL } from 'ufo'
import type { ViteLogger } from '../../logger'

export { k }

export interface VirtualModule {
  id: string
  virtualId: string
  load(opts: {
    logger: ViteLogger
    likec4: LikeC4LanguageServices
    projects: NonEmptyArray<{
      id: ProjectId
      folder: URI
    }>
    assetsDir: string
    useOverviewGraph?: boolean
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
    projectId: ProjectId
    assetsDir: string
    useOverviewGraph?: boolean
  }): Promise<string>
}

export function generateMatches(moduleId: string) {
  return {
    matches: (id: string): ProjectId | null => {
      let { module, projectId } = id.match(/^likec4:plugin\/(?<projectId>.+)\/(?<module>.+)$/)?.groups ??
        id.match(/^likec4:(?<module>.+)\/(?<projectId>.+)$/)?.groups ?? {}
      if (!module || !projectId) {
        return null
      }
      if (module.endsWith('.js')) {
        module = module.slice(0, -3)
      }
      if (module === moduleId) {
        return projectId as ProjectId
      }
      return null
    },
    virtualId: (projectId: ProjectId): string => joinURL(`likec4:plugin`, projectId, moduleId) + '.js',
  }
}

export function generateCombinedProjects(moduleId: string, fnName: string): VirtualModule {
  return {
    id: `likec4:${moduleId}`,
    virtualId: `likec4:plugin/${moduleId}.js`,
    async load({ likec4, logger, projects, assetsDir }) {
      logger.info(k.dim(`generating likec4:${moduleId}`))
      const cases = projects.map(({ id }) => {
        const pkg = joinURL(`likec4:${moduleId}`, id)
        return `    case ${JSON.stringify(id)}: return await import(${JSON.stringify(pkg)})`
      })
      return `
export async function ${fnName}(projectId) {
  switch (projectId) {
    ${cases.join('\n')}
    default: throw new Error('Unknown projectId: ' + projectId)
  }
}
    `
    },
  }
}
