import type { LikeC4ProjectConfig } from '@likec4/config'
import type { ProjectId } from '@likec4/core/types'
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
const SYNTHETIC_DEFAULT_PROJECT_ID = 'default'

/**
 * Every project of the workspace, for commands that process all of them.
 *
 * `projectsManager.all` is the authoritative list of registered projects, but it always
 * appends a synthetic `default` entry pointing at the workspace root. That entry has to be
 * dropped when real projects exist: with a single named project it resolves to that project
 * and duplicates it, with several it contributes an empty model.
 *
 * It must **not** be dropped unconditionally:
 * - a workspace with no `likec4.config.json` at all has `all === ['default']`, and there the
 *   default entry *is* the real project;
 * - `default` also owns any stray sources that sit outside every configured project.
 *
 * `languageServices.projects()` cannot be the base list either. It is grouped by document
 * *ownership*, so a project that pulls all of its sources in through `include.paths` and owns
 * no `.c4` file of its own never appears in it - even though it renders real diagrams. It is
 * only consulted here to decide whether the synthetic `default` entry carries any content.
 */
export function workspaceProjects(likec4: LikeC4): ProjectId[] {
  const all = [...new Set(likec4.projectsManager.all)]
  const ownsDocuments = new Set<string>(likec4.languageServices.projects().map(p => p.id))
  const selected = all.filter(id =>
    id !== SYNTHETIC_DEFAULT_PROJECT_ID
    || ownsDocuments.has(id)
    || all.length === 1
  )
  const dropped = all.filter(id => !selected.includes(id))
  if (dropped.length > 0) {
    logger.debug`skipping synthetic empty project(s): ${dropped.join(', ')}`
  }
  return selected
}
