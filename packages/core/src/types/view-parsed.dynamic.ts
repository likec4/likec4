import { isArray } from 'remeda'
import type { MergeExclusive, Simplify } from 'type-fest'
import type * as aux from './aux'
import type { AnyAux, Unknown } from './aux'
import type { ModelFqnExpr } from './expression-model'
import { isStepEdgeId } from './scalar'
import type { Color, RelationshipArrowType, RelationshipLineType } from './styles'
import type {
  ParsedViewBaseProperties,
  ViewRuleAutoLayout,
  ViewRuleGlobalStyle,
} from './view-common'
import type { ElementViewRuleStyle } from './view-parsed.element'

export interface DynamicViewStep<A extends AnyAux = Unknown> {
  readonly source: aux.StrictFqn<A>
  readonly target: aux.StrictFqn<A>
  readonly title: string | null
  readonly description?: string
  readonly technology?: string
  readonly notation?: string
  // Notes for walkthrough
  readonly notes?: string
  readonly color?: Color
  readonly line?: RelationshipLineType
  readonly head?: RelationshipArrowType
  readonly tail?: RelationshipArrowType
  readonly isBackward?: boolean
  // Link to dynamic view
  readonly navigateTo?: aux.StrictViewId<A>
}

export interface DynamicViewParallelSteps<A extends AnyAux = Unknown> {
  readonly __parallel: DynamicViewStep<A>[]
}

// Get the prefix of the parallel steps
// i.e. step-01.1 -> step-01.
export function getParallelStepsPrefix(id: string): string | null {
  if (isStepEdgeId(id) && id.includes('.')) {
    return id.slice(0, id.indexOf('.') + 1)
  }
  return null
}

export type DynamicViewStepOrParallel<A extends AnyAux = Unknown> = Simplify<
  MergeExclusive<
    DynamicViewStep<A>,
    DynamicViewParallelSteps<A>
  >
>

export interface DynamicViewIncludeRule<A extends AnyAux = Unknown> {
  include: ModelFqnExpr.Any<A>[]
}

export type DynamicViewRule<A extends AnyAux = Unknown> =
  | DynamicViewIncludeRule<A>
  | ViewRuleGlobalStyle
  | ElementViewRuleStyle<A>
  | ViewRuleAutoLayout

export interface ParsedDynamicView<A extends AnyAux = Unknown> extends ParsedViewBaseProperties<A, 'dynamic'> {
  readonly steps: DynamicViewStepOrParallel<A>[]
  readonly rules: DynamicViewRule<A>[]
}

export function isDynamicViewParallelSteps<A extends AnyAux>(
  step: DynamicViewStepOrParallel<A>,
): step is DynamicViewParallelSteps<A> {
  return '__parallel' in step && isArray(step.__parallel)
}
