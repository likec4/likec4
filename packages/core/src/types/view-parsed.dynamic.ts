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
  readonly branches?: NonEmptyReadonlyArray<{
    label?: string
    elements: DynamicViewElement<A>[]
  }>
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
  step: DynamicViewElement<A> | DynamicViewStep<A> | undefined,
): step is DynamicStep<A> {
  return !!step && 'astPath' in step && 'source' in step && 'target' in step
}

export function isDynamicStepsParallel<A extends AnyAux>(
  step: DynamicViewElement<A> | DynamicViewStep<A> | undefined,
): step is DynamicStepsParallel<A> {
  return !!step && '__parallel' in step && isArray((step as DynamicStepsParallel<A>).__parallel)
}

export function isDynamicStepsSeries<A extends AnyAux>(
  step: DynamicViewElement<A> | DynamicViewStep<A> | undefined,
): step is DynamicStepsSeries<A> {
  return !!step && '__series' in step && isArray((step as DynamicStepsSeries<A>).__series)
}

export interface DynamicBlockBody<A extends AnyAux = AnyAux> {
  id: string
  elements: DynamicViewElement<A>[]
}

export interface DynamicIfBlock<A extends AnyAux = AnyAux> {
  readonly kind: 'if'
  id: string
  condition: string
  thenBranch: DynamicBlockBody<A>
  elseIfs: ReadonlyArray<{ condition: string; body: DynamicBlockBody<A> }>
  else?: DynamicBlockBody<A>
}

export interface DynamicOptionalBlock<A extends AnyAux = AnyAux> {
  readonly kind: 'optional'
  id: string
  condition: string
  body: DynamicBlockBody<A>
}

export interface DynamicRepeatBlock<A extends AnyAux = AnyAux> {
  readonly kind: 'repeat'
  id: string
  label?: string
  body: DynamicBlockBody<A>
}

export interface DynamicGroupBlock<A extends AnyAux = AnyAux> {
  readonly kind: 'group'
  id: string
  label: string
  body: DynamicBlockBody<A>
}

export interface DynamicCriticalBlock<A extends AnyAux = AnyAux> {
  readonly kind: 'critical'
  id: string
  label: string
  body: DynamicBlockBody<A>
  fallbacks: ReadonlyArray<{ label: string; body: DynamicBlockBody<A> }>
}

export interface DynamicBreakBlock<A extends AnyAux = AnyAux> {
  readonly kind: 'break'
  id: string
  condition: string
  body: DynamicBlockBody<A>
}

export interface DynamicNote<A extends AnyAux = AnyAux> {
  readonly kind: 'note'
  id: string
  placement: 'over' | 'left' | 'right'
  actors: NonEmptyReadonlyArray<aux.StrictFqn<A>>
  text: string
}

export interface DynamicActivate<A extends AnyAux = AnyAux> {
  readonly kind: 'activate'
  id: string
  actor: aux.StrictFqn<A>
}

export interface DynamicDeactivate<A extends AnyAux = AnyAux> {
  readonly kind: 'deactivate'
  id: string
  actor: aux.StrictFqn<A>
}

export interface DynamicCreate<A extends AnyAux = AnyAux> {
  readonly kind: 'create'
  id: string
  actor: aux.StrictFqn<A>
}

export interface DynamicDestroy<A extends AnyAux = AnyAux> {
  readonly kind: 'destroy'
  id: string
  actor: aux.StrictFqn<A>
}

export type DynamicViewElement<A extends AnyAux = AnyAux> =
  | DynamicStep<A>
  | DynamicStepsSeries<A>
  | DynamicStepsParallel<A>
  | DynamicIfBlock<A>
  | DynamicOptionalBlock<A>
  | DynamicRepeatBlock<A>
  | DynamicGroupBlock<A>
  | DynamicCriticalBlock<A>
  | DynamicBreakBlock<A>
  | DynamicNote<A>
  | DynamicActivate<A>
  | DynamicDeactivate<A>
  | DynamicCreate<A>
  | DynamicDestroy<A>

export function isDynamicBlockBody<A extends AnyAux>(
  value: unknown,
): value is DynamicBlockBody<A> {
  return (
    typeof value === 'object'
    && value !== null
    && 'id' in value
    && 'elements' in value
    && isArray((value as DynamicBlockBody<A>).elements)
  )
}

export function isDynamicIfBlock<A extends AnyAux>(
  element: DynamicViewElement<A>,
): element is DynamicIfBlock<A> {
  return 'kind' in element && (element as DynamicIfBlock<A>).kind === 'if'
}

export function isDynamicOptionalBlock<A extends AnyAux>(
  element: DynamicViewElement<A>,
): element is DynamicOptionalBlock<A> {
  return 'kind' in element && (element as DynamicOptionalBlock<A>).kind === 'optional'
}

export function isDynamicRepeatBlock<A extends AnyAux>(
  element: DynamicViewElement<A>,
): element is DynamicRepeatBlock<A> {
  return 'kind' in element && (element as DynamicRepeatBlock<A>).kind === 'repeat'
}

export function isDynamicGroupBlock<A extends AnyAux>(
  element: DynamicViewElement<A>,
): element is DynamicGroupBlock<A> {
  return 'kind' in element && (element as DynamicGroupBlock<A>).kind === 'group'
}

export function isDynamicCriticalBlock<A extends AnyAux>(
  element: DynamicViewElement<A>,
): element is DynamicCriticalBlock<A> {
  return 'kind' in element && (element as DynamicCriticalBlock<A>).kind === 'critical'
}

export function isDynamicBreakBlock<A extends AnyAux>(
  element: DynamicViewElement<A>,
): element is DynamicBreakBlock<A> {
  return 'kind' in element && (element as DynamicBreakBlock<A>).kind === 'break'
}

export function isDynamicNote<A extends AnyAux>(
  element: DynamicViewElement<A>,
): element is DynamicNote<A> {
  return 'kind' in element && (element as DynamicNote<A>).kind === 'note'
}

export function isDynamicActivate<A extends AnyAux>(
  element: DynamicViewElement<A>,
): element is DynamicActivate<A> {
  return 'kind' in element && (element as DynamicActivate<A>).kind === 'activate'
}

export function isDynamicDeactivate<A extends AnyAux>(
  element: DynamicViewElement<A>,
): element is DynamicDeactivate<A> {
  return 'kind' in element && (element as DynamicDeactivate<A>).kind === 'deactivate'
}

export function isDynamicCreate<A extends AnyAux>(
  element: DynamicViewElement<A>,
): element is DynamicCreate<A> {
  return 'kind' in element && (element as DynamicCreate<A>).kind === 'create'
}

export function isDynamicDestroy<A extends AnyAux>(
  element: DynamicViewElement<A>,
): element is DynamicDestroy<A> {
  return 'kind' in element && (element as DynamicDestroy<A>).kind === 'destroy'
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

  readonly steps: ReadonlyArray<DynamicViewElement<A>>
  readonly rules: DynamicViewRule<A>[]
  readonly autonumber?: { enabled: boolean; start?: number; step?: number }
}
