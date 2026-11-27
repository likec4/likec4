import type { LikeC4ProjectConfig } from '@likec4/config'
import type { FromWorkspaceOptions, LikeC4 as LikeC4Instance } from '@likec4/language-services/node'
import type { LikeC4 } from '../LikeC4'
import { existsSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { ConfigFilenames } from '@likec4/config'
import { loadConfig } from '@likec4/config/node'
import { ProjectId } from '@likec4/core/types'
import { fromWorkspace } from '@likec4/language-services/node'
import { logger } from '../logger'

/**
 * Options of {@link initLikeC4}: common CLI arguments and other options of `fromWorkspace`
 */
export type InitLikeC4Options = Omit<FromWorkspaceOptions, 'includeProjects' | 'graphviz'> & {
  /**
   * Workspace path
   */
  path: string
  /**
   * `--project` argument: project id or folder, see {@link resolveProjectArg}
   */
  project?: string | undefined
  /**
   * Use `dot` binary for layouting instead of WebAssembly
   */
  useDotBin?: boolean | undefined
}

/**
 * Initializes LikeC4 from the workspace, limited to the project from `--project` (if specified).
 * Does not watch the workspace, unless `watch` is set.
 */
export async function initLikeC4({ path, project, useDotBin, ...options }: InitLikeC4Options): Promise<LikeC4Instance> {
  return await fromWorkspace(path, {
    watch: false,
    ...options,
    graphviz: useDotBin ? 'binary' : 'wasm',
    includeProjects: await resolveProjectArg(path, project),
  })
}

/**
 * Resolves the `--project` argument to a project id, before the workspace is loaded,
 * to pass it as `includeProjects` to `fromWorkspace`.
 *
 * The argument is either a project id or a path to the project folder.
 * The project id of a folder is the name from its config file.
 *
 * @returns project id, or `undefined` if no project is specified (or it is the workspace itself)
 * @throws if the folder has no project config
 */
export async function resolveProjectArg(
  workspacePath: string,
  project: string | undefined,
): Promise<string | undefined> {
  if (!project) {
    return undefined
  }
  const projectFolder = resolve(project)
  if (projectFolder === resolve(workspacePath)) {
    return undefined
  }
  if (!existsSync(projectFolder) || !statSync(projectFolder).isDirectory()) {
    return project
  }
  const configFile = ConfigFilenames
    .map(filename => join(projectFolder, filename))
    .find(filepath => existsSync(filepath))
  if (!configFile) {
    throw new Error(`No LikeC4 project config found in ${projectFolder}`)
  }
  const config = await loadConfig(configFile)
  logger.debug`Found project ${config.name} at path: ${projectFolder}`
  return config.name
}

/**
 * Returns the project of the instance, created with `includeProjects` from {@link resolveProjectArg}.
 * Without `--project`, it is the only project of the workspace.
 *
 * @throws if there are several projects to choose from
 */
export function ensureProject(
  likec4: LikeC4,
): { projectId: ProjectId; projectFolder: string; config: LikeC4ProjectConfig } {
  const projectId = likec4.ensureProjectId()
  const p = likec4.projectsManager.getProject(projectId)
  return {
    projectId,
    projectFolder: p.folderUri.fsPath,
    config: p.config,
  }
}

/**
 * Id of the synthetic project the language server always appends to
 * `projectsManager.all` (`ProjectsManager.DefaultProjectId`).
 *
 * It is not re-exported from `@likec4/language-server`, so it is mirrored here. The value is
 * safe to pin: `likec4.config.json` validation rejects `"default"` as a project name, so a
 * real project can never claim this id.
 */
const SYNTHETIC_DEFAULT_PROJECT_ID = ProjectId('default')

/**
 * Every project of the workspace, for commands that process all of them.
 *
 * `projectsManager.all` always appends a synthetic `default` entry for the workspace root. It is kept only when it is
 * the sole project (no config at all), or when it owns stray sources and can be computed on its own. With a single
 * named project `ensureProjectId('default')` resolves to that project, so keeping the entry would duplicate it; its
 * stray sources are skipped with a warning instead.
 *
 * `languageServices.projects()` cannot be the base list: it groups by document ownership, so it misses projects that
 * get all their sources through `include.paths`.
 */
export function workspaceProjects(likec4: LikeC4): ProjectId[] {
  const projectsManager = likec4.projectsManager
  const all = [...new Set(projectsManager.all)]
  if (!all.includes(SYNTHETIC_DEFAULT_PROJECT_ID) || all.length === 1) {
    return all
  }
  const named = all.filter(id => id !== SYNTHETIC_DEFAULT_PROJECT_ID)
  const ownsDocuments = likec4.languageServices.projects().some(p => p.id === SYNTHETIC_DEFAULT_PROJECT_ID)
  const addressable = projectsManager.ensureProjectId(SYNTHETIC_DEFAULT_PROJECT_ID) === SYNTHETIC_DEFAULT_PROJECT_ID
  switch (true) {
    case ownsDocuments && addressable:
      return [...named, SYNTHETIC_DEFAULT_PROJECT_ID]
    case ownsDocuments:
      logger.warn`skipping sources outside every project, move them into a project folder`
      return named
    default:
      logger.debug`skipping synthetic empty project: ${SYNTHETIC_DEFAULT_PROJECT_ID}`
      return named
  }
}
