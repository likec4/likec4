import type { LikeC4ProjectConfig } from '@likec4/config'
import { ProjectId } from '@likec4/core/types'
import { existsSync, statSync } from 'node:fs'
import { resolve, sep } from 'node:path'
import { URI } from 'vscode-uri'
import type { LikeC4 } from '../LikeC4'
import { logger } from '../logger'

function ensureProjectId(likec4: LikeC4, project: string | undefined): ProjectId {
  if (!project) {
    return likec4.languageServices.projectsManager.ensureProjectId()
  }
  const projectFolder = resolve(project)
  if (projectFolder === likec4.workspace) {
    return likec4.languageServices.projectsManager.ensureProjectId()
  }
  if (existsSync(projectFolder) && statSync(projectFolder).isDirectory()) {
    logger.debug`Project path exists: ${projectFolder}`
    const uri = URI.file(projectFolder.endsWith(sep) ? projectFolder : projectFolder + sep)
    const foundProject = likec4.languageServices.projects().find(p => p.folder.fsPath === uri.fsPath)
    if (foundProject) {
      logger.debug`Found project ${foundProject.id} at path: ${projectFolder}`
      return foundProject.id
    }
    logger.debug`No project registered at path: ${projectFolder}`
  }
  return likec4.languageServices.projectsManager.ensureProjectId(project as ProjectId)
}

/** Resolves projectId from path or default; returns projectId, projectFolder and config. */
export function ensureProject(
  likec4: LikeC4,
  project: string | undefined,
): { projectId: ProjectId; projectFolder: string; config: LikeC4ProjectConfig } {
  const projectId = ensureProjectId(likec4, project)
  const p = likec4.languageServices.projectsManager.getProject(projectId)
  likec4.languageServices.projectsManager.defaultProjectId = projectId
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
