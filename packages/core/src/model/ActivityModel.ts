import { first, isEmpty, last } from 'remeda'
import { FqnRef } from '../types'
import type { IteratorLike } from '../types/_common'
import type { Activity, ActivityStep } from '../types/activity'
import {
  type Link,
} from '../types/element'
import {
  type Tag as C4Tag,
  elementFromActivityId,
} from '../types/scalars'
import { commonAncestor, hierarchyLevel } from '../utils'
import type { ElementModel, ElementsIterator } from './ElementModel'
import type { LikeC4Model } from './LikeC4Model'
import { RelationshipModel } from './RelationModel'
import type { AnyAux } from './types'

export type ActivitiesIterator<M extends AnyAux> = IteratorLike<ActivityModel<M>>

export class ActivityModel<M extends AnyAux = AnyAux> {
  public readonly id: M['Fqn']
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
    // this._literalId = this.$activity.id
    // const [projectId, fqn] = splitGlobalFqn(this.id)
    // if (projectId) {
    //   this.imported = {
    //     from: projectId,
    //     fqn,
    //   }
    this.hierarchyLevel = hierarchyLevel(this.$activity.id) + 1
    // } else {
    //   this.imported = null
    //   this.hierarchyLevel = hierarchyLevel(this.id)
    // }
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

  public isDescendantOf(another: ElementModel<M>): boolean {
    return this.element.isDescendantOf(another)
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
  public commonAncestor(another: ElementModel<M>): ElementModel<M> | null {
    const common = commonAncestor(this.id, another.id)
    return common ? this.$model.element(common) : null
  }

  // /**
  //  * Get all descendant elements (i.e. children, children’s children, etc.)
  //  */
  // public descendants(sort?: 'asc' | 'desc'): ElementsIterator<M> {
  //   if (sort) {
  //     const sorted = sortNaturalByFqn([...this.$model.descendants(this)], sort)
  //     return sorted[Symbol.iterator]()
  //   }
  //   return this.$model.descendants(this)
  // }

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

  // /**
  //  * Resolve siblings of the element and its ancestors
  //  *  (from root to closest)
  //  */
  // public *descendingSiblings(): ElementsIterator<M> {
  //   for (const ancestor of [...this.ancestors()].reverse()) {
  //     yield* ancestor.siblings()
  //   }
  //   yield* this.siblings()
  //   return
  // }

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

  public *steps(): IteratorLike<ActivityStepModel<M>> {
    for (const step of this.$activity.steps) {
      yield this.$model.relationship(step.id, 'activity-step')
    }
    return
  }
}

export function isActivityModel<M extends AnyAux = AnyAux>(element: any): element is ActivityModel<M> {
  return element instanceof ActivityModel
}

export class ActivityStepModel<M extends AnyAux = AnyAux> extends RelationshipModel<M> {
  public readonly isBackward: boolean
  public readonly isFirstStep: boolean
  public readonly isLastStep: boolean

  constructor(
    public readonly $model: LikeC4Model<M>,
    public readonly $activityStep: ActivityStep,
    private _activity: ActivityModel<M>,
  ) {
    super(
      $model,
      $activityStep.isBackward === true
        ? {
          ...$activityStep,
          source: FqnRef.isActivityRef($activityStep.target)
            ? elementFromActivityId($activityStep.target.activity)
            : FqnRef.toModelFqn($activityStep.target),
          target: _activity.$activity.modelRef,
        }
        : {
          ...$activityStep,
          source: _activity.$activity.modelRef,
          target: FqnRef.isActivityRef($activityStep.target)
            ? elementFromActivityId($activityStep.target.activity)
            : FqnRef.toModelFqn($activityStep.target),
        },
    )

    this.isBackward = $activityStep.isBackward === true
    this.isFirstStep = first(_activity.$activity.steps)?.id === $activityStep.id
    this.isLastStep = last(_activity.$activity.steps)?.id === $activityStep.id
  }

  public override get title(): string | null {
    if (isEmpty(this.$activityStep.title)) {
      return null
    }
    return this.$activityStep.title
  }

  public override get activity(): ActivityModel<M> {
    return this._activity
  }

  public override get expression(): string {
    if (this.$activityStep.isBackward) {
      return `${this.activity.id} <- ${FqnRef.toModelFqn(this.$activityStep.target)}`
    }
    return `${this.activity.id} -> ${FqnRef.toModelFqn(this.$activityStep.target)}`
  }

  public override isActivityStep(): this is ActivityStepModel<M> {
    return true
  }

  public next(): ActivityStepModel<M> | null {
    const steps = this._activity.$activity.steps
    const index = steps.findIndex(s => s.id === this.$activityStep.id)
    if (index === -1 || index === steps.length - 1) {
      return null
    }
    return this.$model.relationship(steps[index + 1]!.id, 'activity-step')
  }

  public previous(): ActivityStepModel<M> | null {
    const steps = this._activity.$activity.steps
    const index = steps.findIndex(s => s.id === this.$activityStep.id)
    if (index === -1 || index === 0) {
      return null
    }
    return this.$model.relationship(steps[index - 1]!.id, 'activity-step')
  }
}
