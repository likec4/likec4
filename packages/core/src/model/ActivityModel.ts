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
import { type ElementModel, type ElementsIterator } from './ElementModel'
import { isElementModel } from './guards'
import type { LikeC4Model } from './LikeC4Model'
import { RelationshipModel } from './RelationModel'
import type { AnyAux } from './types'
import type { ViewsIterator } from './view/LikeC4ViewModel'

export type ActivitiesIterator<M extends AnyAux> = IteratorLike<ActivityModel<M>>

export class ActivityModel<M extends AnyAux = AnyAux> {
  public readonly id: M['Activity']
  public readonly parent: ElementModel<M>
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
  // public *incomers(): IteratorLike<ActivityModel<M> | ElementModel<M>> {
  //   const unique = new Set<M['Fqn'] | M['Activity']>()
  //   for (const s of this.steps) {
  //     const target = s.target
  //     if (unique.has(target.id) || s.) {
  //       continue
  //     }
  //     unique.add(target.id)
  //     yield target
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

  /**
   * Iterate over all views that include this activity.
   */
  public *views(): ViewsIterator<M> {
    for (const view of this.$model.views()) {
      if (view.includesActivity(this.id)) {
        yield view
      }
    }
    return
  }
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
          title: $activityStep.title ?? activity.title,
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
          title: $activityStep.title ?? activity.title,
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

  get description(): string | null {
    return this.$activityStep.description ?? null
  }

  get technology(): string | null {
    return this.$activityStep.technology ?? null
  }

  get links(): ReadonlyArray<Link> {
    return this.$activityStep.links ?? []
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

  /**
   * Iterate over all views that include this activity step
   */
  public *views(): ViewsIterator<M> {
    for (const view of this.$model.views()) {
      if (view.includesRelation(this.relationship.id)) {
        yield view
      }
    }
    return
  }
}
