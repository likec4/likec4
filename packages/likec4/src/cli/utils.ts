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
