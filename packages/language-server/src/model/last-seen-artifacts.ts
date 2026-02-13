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

  public rememberSpecification(specification: MergedSpecification): MergedSpecification {
    if (specification.projectId) {
      this.#specs.set(specification.projectId, specification)
    }
    return specification
  }

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

  public specification(projectId: c4.ProjectId): MergedSpecification | undefined {
    return this.#specs.get(projectId)
  }

  public styles(projectId: c4.ProjectId): LikeC4Styles | undefined {
    return this.#styles.get(projectId)
  }

  public model(projectId: c4.ProjectId): LikeC4Model.Computed | undefined {
    return this.#models.get(projectId)
  }
}
