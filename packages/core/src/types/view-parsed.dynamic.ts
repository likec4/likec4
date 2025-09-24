import { isArray } from 'remeda'
import type { MergeExclusive, Simplify } from 'type-fest'
import type * as aux from './_aux'
import type { AnyAux } from './_aux'
import type { ExclusiveUnion } from './_common'
import type { _type } from './const'
import type { ModelFqnExpr } from './expression-model'
import { type MarkdownOrString, isStepEdgeId } from './scalar'
import type { Color, RelationshipArrowType, RelationshipLineType } from './styles'
import type {
  BaseParsedViewProperties,
  ViewRuleAutoLayout,
  ViewRuleGlobalPredicateRef,
  ViewRuleGlobalStyle,
} from './view-common'
import type { ElementViewRuleStyle } from './view-parsed.element'

export interface DynamicViewStep<A extends AnyAux = AnyAux> {
  readonly source: aux.StrictFqn<A>
  readonly target: aux.StrictFqn<A>
  readonly title: string | null
  readonly kind?: aux.RelationKind<A>
  readonly description?: MarkdownOrString
  readonly technology?: string
  readonly notation?: string
  // Notes for walkthrough
  readonly notes?: MarkdownOrString
  readonly color?: Color
  readonly line?: RelationshipLineType
  readonly head?: RelationshipArrowType
  readonly tail?: RelationshipArrowType
  readonly isBackward?: boolean
  // Link to dynamic view
  readonly navigateTo?: aux.StrictViewId<A>
}

export interface DynamicViewParallelSteps<A extends AnyAux = AnyAux> {
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

export type DynamicViewStepOrParallel<A extends AnyAux = AnyAux> = Simplify<
  MergeExclusive<
    DynamicViewStep<A>,
    DynamicViewParallelSteps<A>
  >
>

export interface DynamicViewIncludeRule<A extends AnyAux = AnyAux> {
  include: ModelFqnExpr.Any<A>[]
}

export type DynamicViewRule<A extends AnyAux = AnyAux> = ExclusiveUnion<{
  Include: DynamicViewIncludeRule<A>
  GlobalPredicateRef: ViewRuleGlobalPredicateRef
  ElementViewRuleStyle: ElementViewRuleStyle<A>
  GlobalStyle: ViewRuleGlobalStyle
  AutoLayout: ViewRuleAutoLayout
}>

export type DynamicViewDisplayVariant = 'diagram' | 'sequence'

export interface ParsedDynamicView<A extends AnyAux = AnyAux> extends BaseParsedViewProperties<A> {
  [_type]: 'dynamic'
  /**
   * How to display the dynamic view
   * - `diagram`: display as a regular likec4 view
   * - `sequence`: display as a sequence diagram
   *
   * @default 'diagram'
   */
  readonly variant?: DynamicViewDisplayVariant

  readonly steps: DynamicViewStepOrParallel<A>[]
  readonly rules: DynamicViewRule<A>[]
}

export function isDynamicViewParallelSteps<A extends AnyAux>(
  step: DynamicViewStepOrParallel<A>,
): step is DynamicViewParallelSteps<A> {
  return '__parallel' in step && isArray(step.__parallel)
}
