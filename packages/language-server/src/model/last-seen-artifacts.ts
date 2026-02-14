import type * as c4 from '@likec4/core'
import type { LikeC4Model } from '@likec4/core/model'
import type { LikeC4Styles } from '@likec4/core/styles'
import type { LikeC4Services } from '../module'
import { MergedSpecification } from './builder/MergedSpecification'

/**
 * Provides access to "last seen artifacts" for a given project,
 * (Results of the last successful parsing)
 */
export class LastSeenArtifacts {
  #specs = new Map<c4.ProjectId, MergedSpecification>()
  #styles = new Map<c4.ProjectId, LikeC4Styles>()
  #models = new Map<c4.ProjectId, LikeC4Model.Computed>()

  constructor(services: LikeC4Services) {
    services.shared.workspace.WorkspaceManager.onForceCleanCache(() => {
      this.#specs.clear()
      this.#styles.clear()
      this.#models.clear()
    })
  }

  /**
   * Cache the last successful merged specification for its project.
   * @param specification - MergedSpecification to store (by projectId).
   * @returns The same specification (stores in internal map when projectId is set).
   */
  public rememberSpecification(specification: MergedSpecification): MergedSpecification {
    if (specification.projectId) {
      this.#specs.set(specification.projectId, specification)
    }
    return specification
  }

  /**
   * Cache the last successful computed model and its styles for the project.
   * @param model - LikeC4Model.Computed to store (by projectId).
   * @returns The same model (stores model and styles in internal maps).
   */
  public rememberModel<M extends LikeC4Model.Computed>(model: M): M {
    const projectId = model.projectId as c4.ProjectId
    const styles = model.$styles

    const existing = this.#styles.get(projectId)
    if (!existing || !existing.equals(styles)) {
      this.#styles.set(projectId, styles)
    }

    this.#models.set(projectId, model)

    return model
  }

  /**
   * Returns the last seen merged specification for the given project, if available.
   * @param projectId - Project id to look up.
   * @returns MergedSpecification or undefined.
   */
  public specification(projectId: c4.ProjectId): MergedSpecification | undefined {
    return this.#specs.get(projectId)
  }

  /**
   * Returns the last seen styles for the given project, if available.
   * @param projectId - Project id to look up.
   * @returns LikeC4Styles or undefined.
   */
  public styles(projectId: c4.ProjectId): LikeC4Styles | undefined {
    return this.#styles.get(projectId)
  }

  /**
   * Returns the last seen computed model for the given project, if available.
   * @param projectId - Project id to look up.
   * @returns LikeC4Model.Computed or undefined.
   */
  public model(projectId: c4.ProjectId): LikeC4Model.Computed | undefined {
    return this.#models.get(projectId)
  }
}
