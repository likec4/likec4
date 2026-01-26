import { isArray } from 'remeda'
import type * as aux from './_aux'
import type { AnyAux } from './_aux'
import type { ExclusiveUnion, NonEmptyReadonlyArray } from './_common'
import type { _type } from './const'
import type { ModelFqnExpr } from './expression-model'
import type { MarkdownOrString } from './scalar'
import { isStepEdgeId } from './scalar'
import type { Color, RelationshipArrowType, RelationshipLineType } from './styles'
import type {
  BaseParsedViewProperties,
  ViewRuleAutoLayout,
  ViewRuleGlobalPredicateRef,
  ViewRuleGlobalStyle,
} from './view-common'
import type { ElementViewRuleStyle } from './view-parsed.element'

export interface DynamicStep<A extends AnyAux = AnyAux> {
  readonly source: aux.StrictFqn<A>
  readonly target: aux.StrictFqn<A>
  readonly title?: string | null
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

  /**
   * Path to the AST node relative to the view body ast
   * Used to locate the step in the source code
   */
  readonly astPath: string
}

export interface DynamicStepsSeries<A extends AnyAux = AnyAux> {
  readonly seriesId: string
  readonly __series: NonEmptyReadonlyArray<DynamicStep<A>>
}

export interface DynamicStepsParallel<A extends AnyAux = AnyAux> {
  readonly parallelId: string
  readonly __parallel: NonEmptyReadonlyArray<DynamicStep<A> | DynamicStepsSeries<A>>
}

// Get the prefix of the parallel steps
// i.e. step-01.1 -> step-01.
export function getParallelStepsPrefix(id: string): string | null {
  if (isStepEdgeId(id) && id.includes('.')) {
    return id.slice(0, id.indexOf('.') + 1)
  }
  return null
}

export type DynamicViewStep<A extends AnyAux = AnyAux> = ExclusiveUnion<{
  Step: DynamicStep<A>
  Series: DynamicStepsSeries<A>
  Parallel: DynamicStepsParallel<A>
}>

export function isDynamicStep<A extends AnyAux>(
  step: DynamicViewStep<A> | undefined,
): step is DynamicStep<A> {
  return !!step && !('__series' in step || '__parallel' in step)
}

export function isDynamicStepsParallel<A extends AnyAux>(
  step: DynamicViewStep<A> | undefined,
): step is DynamicStepsParallel<A> {
  return !!step && '__parallel' in step && isArray(step.__parallel)
}

export function isDynamicStepsSeries<A extends AnyAux>(
  step: DynamicViewStep<A> | undefined,
): step is DynamicStepsSeries<A> {
  return !!step && '__series' in step && isArray(step.__series)
}

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

  readonly steps: DynamicViewStep<A>[]
  readonly rules: DynamicViewRule<A>[]
}
