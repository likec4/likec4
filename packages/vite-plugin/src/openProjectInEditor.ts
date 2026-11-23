import type { ProjectId } from '@likec4/core/types'
import type { LikeC4LanguageServices } from '@likec4/language-services'
import { URI } from 'langium'
import { existsSync } from 'node:fs'
import type { ViteDevServer } from 'vite'

type LocateParams = Parameters<LikeC4LanguageServices['locate']>[0]

export const OPEN_PROJECT_ENDPOINT = '/__likec4/open-project'
export const OPEN_SOURCE_ENDPOINT = '/__likec4/open-source'

/**
 * Resolves what to open for the project: its config file, or the project folder if there is no config file.
 */
function resolveProjectTarget(likec4: LikeC4LanguageServices, projectId: string): string | null {
  const manager = likec4.projectsManager
  const id = projectId as ProjectId
  if (!manager.all.includes(id)) {
    return null
  }
  const { configUri, folderUri } = manager.getProject(id)
  return existsSync(configUri.fsPath) ? configUri.fsPath : folderUri.fsPath
}

/**
 * Resolves the source location (`file:line:column`) of an element, relation, view etc.
 */
function resolveSourceTarget(likec4: LikeC4LanguageServices, rawParams: string | null): string | null {
  if (!rawParams) {
    return null
  }
  try {
    const location = likec4.locate(JSON.parse(rawParams) as LocateParams)
    if (!location) {
      return null
    }
    const { line, character } = location.range.start
    return `${URI.parse(location.uri).fsPath}:${line + 1}:${character + 1}`
  } catch {
    return null
  }
}

/**
 * Dev-only: opens the project config in the user's editor.
 * The client sends only a project id, the path is resolved on the server,
 * then the request is handed over to Vite's built-in `/__open-in-editor` middleware.
 */
export function enableOpenProjectInEditor(server: ViteDevServer, likec4: LikeC4LanguageServices): void {
  // Not mounted on a route on purpose: connect restores the route prefix after `next()`,
  // which would break the url rewrite below.
  server.middlewares.use((req, res, next) => {
    const url = new URL(req.url ?? '', 'http://localhost')
    let target: string | null
    switch (url.pathname) {
      case OPEN_PROJECT_ENDPOINT: {
        const projectId = url.searchParams.get('id')
        target = projectId ? resolveProjectTarget(likec4, projectId) : null
        break
      }
      case OPEN_SOURCE_ENDPOINT:
        target = resolveSourceTarget(likec4, url.searchParams.get('params'))
        break
      default:
        return next()
    }
    if (!target) {
      res.statusCode = 404
      res.end('Not found')
      return
    }
    req.url = `/__open-in-editor?file=${encodeURIComponent(target)}`
    next()
  })
}
