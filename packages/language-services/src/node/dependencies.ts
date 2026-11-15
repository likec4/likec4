import type { ProjectId } from '@likec4/core/types'
import type { DependencyInstallResult, DependencyState, GitDependencySource } from '@likec4/language-server'
import type { LikeC4Langium } from '../common/LikeC4'

/**
 * Git dependency of a consumer project that is not installed (see {@link DependenciesNotInstalledError})
 */
export interface NotInstalledDependency {
  /**
   * Consumer project
   */
  projectId: ProjectId
  /**
   * Import name (key of the `dependencies` section)
   */
  name: string
  source: GitDependencySource
}

/**
 * Formats the git source as `url#ref[:path]`
 */
export function formatGitDependencySource(source: GitDependencySource): string {
  return `${source.git}#${source.ref}${source.path ? `:${source.path}` : ''}`
}

/**
 * Thrown by `fromWorkspace` with `requireInstalledDependencies`
 * if git dependencies of the workspace are not installed.
 */
export class DependenciesNotInstalledError extends Error {
  override readonly name = 'DependenciesNotInstalledError'

  constructor(readonly dependencies: ReadonlyArray<NotInstalledDependency>) {
    const single = dependencies.length === 1
    super(
      [
        single ? 'Dependency is not installed:' : 'Dependencies are not installed:',
        ...dependencies.map(({ projectId, name, source }) =>
          `  - '${name}' of project '${projectId}' (${formatGitDependencySource(source)})`
        ),
        `Run \`likec4 install\` to install ${single ? 'it' : 'them'}.`,
      ].join('\n'),
    )
  }
}

/**
 * Thrown by {@link installDependencies} if the project or the dependency to install is unknown
 */
export class InstallTargetNotFoundError extends Error {
  override readonly name = 'InstallTargetNotFoundError'

  constructor(
    /**
     * What is not found
     */
    readonly target: 'project' | 'dependency',
    message: string,
  ) {
    super(message)
  }
}

/**
 * Git dependencies of the workspace that are not installed (no SHA in the version index, or no instance in the storage)
 *
 * @param project - only dependencies of this consumer project, if it is a known project id
 *   (otherwise, e.g. a path, dependencies of all projects)
 */
export function notInstalledDependencies(
  langium: LikeC4Langium,
  project?: string | undefined,
): NotInstalledDependency[] {
  const known = project !== undefined
    && langium.shared.workspace.ProjectsManager.all.some(id => id === project)
  const consumer = known ? langium.shared.workspace.ProjectsManager.ensureProjectId(project as ProjectId) : undefined
  return langium.shared.dependencies.States.all(consumer)
    .filter(state => state.status === 'not-installed')
    .map(({ consumer, name, source }) => ({ projectId: consumer, name, source }))
}

/**
 * Options of {@link installDependencies}
 */
export interface InstallDependenciesOptions {
  /**
   * Consumer project, all projects if not set
   */
  project?: string | undefined
  /**
   * Import name (key of the `dependencies` section), all git dependencies if not set
   */
  name?: string | undefined
  /**
   * Resolve refs again (`likec4 update`), otherwise refs found in the version index are kept
   * @default false
   */
  update?: boolean | undefined
}

/**
 * Result of installing a git dependency of a consumer project
 */
export interface DependencyInstallReport {
  projectId: ProjectId
  name: string
  source: GitDependencySource
  /**
   * SHA of the instance before the call, undefined if the dependency was not installed
   */
  previousSha: string | undefined
  result: DependencyInstallResult
}

/**
 * Installs git dependencies of the workspace and registers installed instances (see `likec4 install`).
 * Runs git and network.
 *
 * @throws {@link InstallTargetNotFoundError} if the project or the dependency name is unknown
 */
export async function installDependencies(
  langium: LikeC4Langium,
  options?: InstallDependenciesOptions,
): Promise<DependencyInstallReport[]> {
  const projectsManager = langium.shared.workspace.ProjectsManager
  const project = options?.project
  if (project !== undefined && !projectsManager.all.some(id => id === project)) {
    throw new InstallTargetNotFoundError('project', `Project '${project}' not found`)
  }
  const projectId = project !== undefined ? projectsManager.ensureProjectId(project as ProjectId) : undefined
  const name = options?.name
  const before = langium.shared.dependencies.States.all(projectId)
    .filter(state => name === undefined || state.name === name)
  if (name !== undefined && before.length === 0) {
    const scope = projectId !== undefined ? ` of project '${projectId}'` : ''
    throw new InstallTargetNotFoundError('dependency', `Git dependency '${name}'${scope} not found`)
  }
  if (before.length === 0) {
    return []
  }
  const { results } = await langium.shared.lsp.ExecuteCommandHandler.installDependencies({
    projectId,
    name,
    update: options?.update === true,
  })
  const key = (consumer: ProjectId, dependency: string) => JSON.stringify([consumer, dependency])
  const states = new Map<string, DependencyState>(before.map(state => [key(state.consumer, state.name), state]))
  return results.map(({ projectId, name, result }) => {
    const state = states.get(key(projectId, name))
    if (!state) {
      // The command reports only dependencies whose states were read above
      throw new Error(`Unexpected install result of dependency '${name}' of project '${projectId}'`)
    }
    return {
      projectId,
      name,
      source: state.source,
      previousSha: state.status === 'installed' ? state.instance.sha : undefined,
      result,
    }
  })
}
