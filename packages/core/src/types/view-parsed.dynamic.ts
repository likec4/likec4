import type * as aux from './_aux'
import type { AnyAux } from './_aux'
import type { ExclusiveUnion, NonEmptyReadonlyArray } from './_common'
import { _type } from './const'
import type { ModelFqnExpr } from './expression-model'
import * as scalar from './scalar'
import { isStepEdgeId } from './scalar'
import type { Color, RelationshipArrowType, RelationshipLineType } from './styles'
import type {
  BaseParsedViewProperties,
  ViewRuleAutoLayout,
  ViewRuleGlobalPredicateRef,
  ViewRuleGlobalStyle,
} from './view-common'
import type { ElementViewRuleStyle } from './view-parsed.element'

export interface Step<A extends AnyAux = AnyAux> {
  readonly source: aux.StrictFqn<A>
  readonly target: aux.StrictFqn<A>
  readonly title?: string | null
  readonly kind?: aux.RelationKind<A>
  readonly description?: scalar.MarkdownOrString
  readonly technology?: string
  readonly notation?: string
  // Notes for walkthrough
  readonly notes?: scalar.MarkdownOrString
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

export type AnyStep<A extends AnyAux = AnyAux> = ExclusiveUnion<{
  Step: Step<A>
  Series: Step.Series<A>
  Parallel: Step.Parallel<A>
  Opt: Step.Opt<A>
  Loop: Step.Loop<A>
  Try: Step.Try<A>
  Alt: Step.Alt<A>
  Break: Step.Break<A>
}>

export const stepGuards = {
  isStep: <A extends AnyAux>(step: AnyStep<A> | undefined | null): step is Step<A> => {
    return !!step && 'source' in step && 'target' in step
  },
  isSeries: <A extends AnyAux>(step: AnyStep<A> | undefined | null): step is Step.Series<A> => {
    return !!step && _type in step && step[_type] === 'series'
  },
  isParallel: <A extends AnyAux>(step: AnyStep<A> | undefined | null): step is Step.Parallel<A> => {
    return !!step && _type in step && step[_type] === 'par'
  },
  isOpt: <A extends AnyAux>(step: AnyStep<A> | undefined | null): step is Step.Opt<A> => {
    return !!step && _type in step && step[_type] === 'opt'
  },
  isLoop: <A extends AnyAux>(step: AnyStep<A> | undefined | null): step is Step.Loop<A> => {
    return !!step && _type in step && step[_type] === 'loop'
  },
  isTry: <A extends AnyAux>(step: AnyStep<A> | undefined | null): step is Step.Try<A> => {
    return !!step && _type in step && step[_type] === 'try'
  },
  isAlt: <A extends AnyAux>(step: AnyStep<A> | undefined | null): step is Step.Alt<A> => {
    return !!step && _type in step && step[_type] === 'alt'
  },
  isBreak: <A extends AnyAux>(step: AnyStep<A> | undefined | null): step is Step.Break<A> => {
    return !!step && _type in step && step[_type] === 'break'
  },
}

export interface WithSteps<A extends AnyAux> {
  readonly steps: NonEmptyReadonlyArray<AnyStep<A>>
}

export namespace Step {
  export type Any<A extends AnyAux = AnyAux> = AnyStep<A>

  /**
   * Chain of steps (used for sequential execution)
   */
  export interface Series<A extends AnyAux = AnyAux> {
    readonly [_type]: 'series'
    readonly steps: NonEmptyReadonlyArray<Step<A>>
  }

  /**
   * Block of parallel steps
   */
  export interface Parallel<A extends AnyAux = AnyAux> extends WithSteps<A> {
    readonly [_type]: 'par'
    readonly title?: string
  }

  /**
   * Try-catch-finally block
   */
  export interface Try<A extends AnyAux = AnyAux> {
    readonly [_type]: 'try'
    /**
     * Try section
     */
    readonly try: WithSteps<A> & {
      readonly title?: string
    }
    /**
     * Catch section (optional)
     */
    readonly catch?: WithSteps<A> & {
      readonly title?: string
    }
    /**
     * Finally section (optional)
     */
    readonly finally?: WithSteps<A> & {
      readonly title?: string
    }
  }

  /**
   * Opt block (opt)
   */
  export interface Opt<A extends AnyAux = AnyAux> extends WithSteps<A> {
    readonly [_type]: 'opt'
    readonly title?: string
  }

  /**
   * Break block
   */
  export interface Break<A extends AnyAux = AnyAux> extends WithSteps<A> {
    readonly [_type]: 'break'
    readonly title?: string
  }

  /**
   * Loop block (loop)
   */
  export interface Loop<A extends AnyAux = AnyAux> extends WithSteps<A> {
    readonly [_type]: 'loop'
    readonly title?: string
  }

  /**
   * Group of alternative branches (alt)
   */
  export interface Alt<A extends AnyAux = AnyAux> {
    readonly [_type]: 'alt'
    readonly title?: string
    readonly branches: NonEmptyReadonlyArray<AltBranch<A>>
  }

  /**
   * Branch block (if/else/if, when, opt)
   */
  export interface AltBranch<A extends AnyAux = AnyAux> extends WithSteps<A> {
    readonly [_type]: 'when' | 'if' | 'else'
    readonly title?: string
  }
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

  readonly steps: Step.Any<A>[]
  readonly rules: DynamicViewRule<A>[]
}
