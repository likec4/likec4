import type { LikeC4Project, NonEmptyArray, ProjectId } from '@likec4/core'
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
    projects: NonEmptyArray<
      LikeC4Project & {
        folder: URI
      }
    >
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
    project: LikeC4Project & {
      folder: URI
    }
    assetsDir: string
    useOverviewGraph?: boolean
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

// Escape potentially dangerous characters for safe code generation
const charMap: Record<string, string> = {
  '<': '\\u003C',
  '>': '\\u003E',
  '/': '\\u002F',
  '\\': '\\\\',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\0': '\\0',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}
function escapeUnsafeChars(str: string): string {
  // oxlint-disable-next-line no-control-regex
  return str.replace(/[<>\b\f\n\r\t\0\u2028\u2029\\]/g, x => charMap[x]!)
}

export function generateCombinedProjects(moduleId: string, fnName: string): VirtualModule {
  return {
    id: `likec4:${moduleId}`,
    virtualId: `likec4:plugin/${moduleId}.js`,
    async load({ logger, projects }) {
      logger.info(k.dim(`generating likec4:${moduleId}`))
      const cases = projects.map(({ id }) => {
        const pkg = escapeUnsafeChars(
          JSON.stringify(
            joinURL(`likec4:${moduleId}`, id),
          ),
        )
        return `  ${JSON.stringify(id)}: () => import(${pkg})`
        // return `  ${JSON.stringify(id)}: () => ${pkg}`
      })
      return `
export let ${fnName}Fn = {
${cases.join(',\n')}
}      

export async function ${fnName}(projectId) {
  let fn = ${fnName}Fn[projectId]
  if (!fn) {
    const projects = Object.keys(${fnName}Fn)
    console.error('Unknown projectId: ' + projectId + ' (available: ' + projectIds + ')')
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
