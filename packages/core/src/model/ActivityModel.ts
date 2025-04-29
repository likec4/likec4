import { first, isEmpty, last } from 'remeda'
import { invariant, nonNullable } from '../errors'
import { FqnRef } from '../types'
import type { IteratorLike } from '../types/_common'
import type { Activity, ActivityStep } from '../types/activity'
import {
  type Link,
} from '../types/element'
import {
  type Tag,
  type Tag as C4Tag,
  elementFromActivityId,
} from '../types/scalars'
import { commonAncestor, hierarchyLevel } from '../utils'
import { type ElementModel, type ElementsIterator, isElementModel } from './ElementModel'
import type { LikeC4Model } from './LikeC4Model'
import { RelationshipModel } from './RelationModel'
import type { AnyAux } from './types'

export type ActivitiesIterator<M extends AnyAux> = IteratorLike<ActivityModel<M>>

export class ActivityModel<M extends AnyAux = AnyAux> {
  public readonly id: M['Activity']
  public readonly parent: ElementModel<M>
  // readonly _literalId: M['Element']
  public readonly hierarchyLevel: number

  // readonly imported: null | {
  //   from: ProjectId
  //   fqn: string
  // }

  constructor(
    public readonly $model: LikeC4Model<M>,
    public readonly element: ElementModel<M>,
    public readonly $activity: Activity,
  ) {
    this.id = this.$activity.id
    this.hierarchyLevel = hierarchyLevel(this.$activity.id) + 1
    this.parent = this.element
  }

  get name(): string {
    return this.$activity.name
  }

  get tags(): ReadonlyArray<C4Tag> {
    return this.$activity.tags ?? []
  }

  get title(): string {
    return this.$activity.title ?? this.$activity.name
  }

  get description(): string | null {
    return this.$activity.description ?? null
  }

  get technology(): string | null {
    return this.$activity.technology ?? null
  }

  get links(): ReadonlyArray<Link> {
    return this.$activity.links ?? []
  }

  get steps(): readonly ActivityStepModel<M>[] {
    return this.$model.activitySteps(this.id)
  }

  public isDescendantOf(another: ElementModel<M>): boolean {
    return this.element === another || this.element.isDescendantOf(another)
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public *ancestors(): ElementsIterator<M> {
    yield this.element
    yield* this.element.ancestors()
    return
  }

  /**
   * Returns the common ancestor of this element and another element.
   */
  public commonAncestor(another: ElementModel<M> | ActivityModel<M>): ElementModel<M> | null {
    const common = commonAncestor(this.id, isElementModel(another) ? another.id : another.element.id)
    return common ? this.$model.element(common) : null
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public *siblings(): ElementsIterator<M> {
    yield* this.element.siblings()
    return
  }

  /**
   * Resolve siblings of the element and its ancestors
   *  (from closest to root)
   */
  public *ascendingSiblings(): ElementsIterator<M> {
    yield* this.element.ascendingSiblings()
    return
  }

  // public incoming(filter: IncomingFilter = 'all'): RelationshipsIterator<M> {
  //   return this.$model.incoming(this, filter)
  // }
  // public *incomers(filter: IncomingFilter = 'all'): ElementsIterator<M> {
  //   const unique = new Set<M['Fqn']>()
  //   for (const r of this.incoming(filter)) {
  //     if (unique.has(r.source.id)) {
  //       continue
  //     }
  //     unique.add(r.source.id)
  //     yield r.source
  //   }
  //   return
  // }
  // public outgoing(filter: OutgoingFilter = 'all'): RelationshipsIterator<M> {
  //   return this.$model.outgoing(this, filter)
  // }
  // public *outgoers(filter: OutgoingFilter = 'all'): ElementsIterator<M> {
  //   const unique = new Set<M['Fqn']>()
  //   for (const r of this.outgoing(filter)) {
  //     if (unique.has(r.target.id)) {
  //       continue
  //     }
  //     unique.add(r.target.id)
  //     yield r.target
  //   }
  //   return
  // }

  // protected cachedOutgoing: Set<RelationshipModel<M>> | null = null
  // protected cachedIncoming: Set<RelationshipModel<M>> | null = null

  // public get allOutgoing(): ReadonlySet<RelationshipModel<M>> {
  //   this.cachedOutgoing ??= new Set(this.outgoing())
  //   return this.cachedOutgoing
  // }

  // public get allIncoming(): ReadonlySet<RelationshipModel<M>> {
  //   this.cachedIncoming ??= new Set(this.incoming())
  //   return this.cachedIncoming
  // }

  // /**
  //  * Iterate over all views that include this element.
  //  */
  // public *views(): ViewsIterator<M> {
  //   for (const view of this.$model.views()) {
  //     if (view.includesElement(this.id)) {
  //       yield view
  //     }
  //   }
  //   return
  // }

  // /**
  //  * Iterate over all views that scope this element.
  //  * It is possible that element is not included in the view.
  //  */
  // public *scopedViews(): ViewsIterator<M> {
  //   for (const vm of this.$model.views()) {
  //     if (vm.isElementView() && vm.$view.viewOf === this.id) {
  //       yield vm
  //     }
  //   }
  //   return
  // }

  // /**
  //  * @returns true if the element is deployed
  //  */
  // public isDeployed(): boolean {
  //   return isTruthy(this.deployments().next().value)
  // }

  // public deployments(): DeployedInstancesIterator<M> {
  //   return this.$model.deployment.instancesOf(this)
  // }
}

export function isActivityModel<M extends AnyAux = AnyAux>(element: any): element is ActivityModel<M> {
  return element instanceof ActivityModel
}

export class ActivityStepModel<M extends AnyAux = AnyAux> {
  public readonly id: M['RelationId']
  public readonly isBackward: boolean
  public readonly isFirstStep: boolean
  public readonly isLastStep: boolean
  public readonly index: number

  public readonly source: ActivityModel<M>
  public readonly target: ActivityModel<M> | ElementModel<M>

  /** `
   * Relationship model for the activity step
   * Takes into account the direction of the step
   */
  public readonly relationship: RelationshipModel<M>

  constructor(
    public readonly $model: LikeC4Model<M>,
    public readonly $activityStep: ActivityStep,
    public readonly activity: ActivityModel<M>,
  ) {
    this.id = this.$activityStep.id
    this.source = activity
    if (FqnRef.isActivityRef($activityStep.target)) {
      this.target = this.$model.activity($activityStep.target.activity)
    } else {
      this.target = this.$model.element(FqnRef.toModelFqn($activityStep.target))
    }

    if ($activityStep.isBackward) {
      this.relationship = new RelationshipModel(
        this.$model,
        {
          ...$activityStep,
          source: FqnRef.isActivityRef($activityStep.target)
            ? elementFromActivityId($activityStep.target.activity)
            : FqnRef.toModelFqn($activityStep.target),
          target: activity.element.id,
        },
        this,
      )
    } else {
      this.relationship = new RelationshipModel(
        this.$model,
        {
          ...$activityStep,
          source: activity.element.id,
          target: FqnRef.isActivityRef($activityStep.target)
            ? elementFromActivityId($activityStep.target.activity)
            : FqnRef.toModelFqn($activityStep.target),
        },
        this,
      )
    }

    this.isBackward = $activityStep.isBackward === true
    this.isFirstStep = first(activity.$activity.steps)?.id === $activityStep.id
    this.isLastStep = last(activity.$activity.steps)?.id === $activityStep.id
    this.index = activity.$activity.steps.findIndex(s => s.id === $activityStep.id)
    invariant(this.index >= 0, 'Activity step not found in activity')
  }

  get tags(): ReadonlyArray<Tag> {
    return this.$activityStep.tags ?? []
  }

  get title(): string | null {
    if (isEmpty(this.$activityStep.title)) {
      return null
    }
    return this.$activityStep.title
  }

  get expression(): string {
    if (this.$activityStep.isBackward) {
      return `${this.activity.id} <- ${FqnRef.toModelFqn(this.$activityStep.target)}`
    }
    return `${this.activity.id} -> ${FqnRef.toModelFqn(this.$activityStep.target)}`
  }

  get next(): ActivityStepModel<M> | null {
    if (this.isLastStep) {
      return null
    }
    return nonNullable(this.activity.steps[this.index + 1], 'Next activity step not found')
  }

  get previous(): ActivityStepModel<M> | null {
    if (this.isFirstStep) {
      return null
    }
    return nonNullable(this.activity.steps[this.index - 1], 'Previous activity step not found')
  }
}
