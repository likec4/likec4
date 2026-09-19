import { indexBy, mapValues, pipe, prop } from 'remeda'
import { describe, expect, it, vi } from 'vitest'
import { Builder } from '../builder/Builder'
import { invariant } from '../utils'
import { type ViewId, StepPath } from './scalar'
import { isDynamicView } from './view'
import type { ComputedDynamicView } from './view-computed'
import { DynamicViewFlow, flowAncestors, flowHelpers, parentFlow, walkthroughFlow } from './view-dynamic-flow'

const viewId = 'index' as ViewId<'index'>

const sp = (path: string) => path as StepPath

const specs = Builder
  .specification({
    elements: {
      el: {},
    },
    relationships: {
      requests: {
        technology: 'HTTP Request',
      },
    },
    tags: {},
  })

const baseModel = specs
  .model(({ el }, _) =>
    _(
      el('a').with(
        el('child1'),
        el('child2'),
      ),
      el('b').with(
        el('child1'),
        el('child2'),
      ),
      el('shopify'),
      el('webhook'),
    )
  )

describe('flowAncestors', () => {
  it('should return valid ancestors from computed model', () => {
    const view = baseModel
      .views(({ dynamicView, $step }, _) =>
        _(
          dynamicView('dynview').with(
            $step('a.child1 -> a.child2'),
            $step.alt(
              $step.when(
                $step.try({
                  try: [
                    $step('a.child2 -> b.child1'),
                  ],
                  catch: [
                    $step('a.child2 -> b.child2'),
                  ],
                  finally: [
                    $step.loop(
                      $step('a.child2 -> b.child2'),
                    ),
                  ],
                }),
              ),
            ),
          ),
        )
      )
      .toLikeC4Model()
      .view('dynview')
      .$view
    const edgeAncestors = pipe(
      view.edges,
      indexBy(prop('id')),
      mapValues(e => flowAncestors(e.id)),
    )
    expect(edgeAncestors).toEqual({
      'step-01': [],
      'step-02:alt.01:when.01:try.01:block.01': [
        'step-02:alt',
        'step-02:alt.01:when',
        'step-02:alt.01:when.01:try',
        'step-02:alt.01:when.01:try.01:block',
      ],
      'step-02:alt.01:when.01:try.02:catch.01': [
        'step-02:alt',
        'step-02:alt.01:when',
        'step-02:alt.01:when.01:try',
        'step-02:alt.01:when.01:try.02:catch',
      ],
      'step-02:alt.01:when.01:try.03:finally.01:loop.01': [
        'step-02:alt',
        'step-02:alt.01:when',
        'step-02:alt.01:when.01:try',
        'step-02:alt.01:when.01:try.03:finally',
        'step-02:alt.01:when.01:try.03:finally.01:loop',
      ],
    })
  })

  it('should return empty array for a top-level leaf step', () => {
    expect(flowAncestors(sp('step-04'))).toEqual([])
  })

  it('should return empty array for a top-level flow id (not its own ancestor)', () => {
    expect(flowAncestors(sp('step-01:opt'))).toEqual([])
  })

  it('should return the enclosing flow for a step nested in one subflow', () => {
    expect(flowAncestors(sp('step-01.02:opt.03'))).toEqual([
      'step-01.02:opt',
    ])
  })

  it('should return ancestors ordered from outermost to innermost', () => {
    expect(flowAncestors(sp('step-01.02:opt.03:try.04'))).toEqual([
      'step-01.02:opt',
      'step-01.02:opt.03:try',
    ])
  })

  it('should resolve the full ancestor chain for a deeply nested step', () => {
    expect(flowAncestors(sp('step-01.02:opt.03:try.01:block.04'))).toEqual([
      'step-01.02:opt',
      'step-01.02:opt.03:try',
      'step-01.02:opt.03:try.01:block',
    ])
  })

  it('should exclude the path itself when it is a flow id', () => {
    expect(flowAncestors(sp('step-01.02:opt.03:try'))).toEqual([
      'step-01.02:opt',
    ])
  })

  it('should only treat `:`-bearing segments as flows', () => {
    // Plain step segments (no `:type`) are never ancestors.
    expect(flowAncestors(sp('step-01.02.03'))).toEqual([])
  })
})

describe('parentFlow', () => {
  it('should return null for a top-level leaf step', () => {
    expect(parentFlow(sp('step-04'))).toBeNull()
  })

  it('should return null for a top-level flow id', () => {
    expect(parentFlow(sp('step-01:opt'))).toBeNull()
  })

  it('should return the immediate enclosing flow for a nested step', () => {
    expect(parentFlow(sp('step-01.02:opt.03'))).toBe('step-01.02:opt')
  })

  it('should return the innermost flow for a deeply nested step', () => {
    expect(parentFlow(sp('step-01.02:opt.03:try.04'))).toBe('step-01.02:opt.03:try')
  })

  it('should return the parent flow when the path itself is a flow id', () => {
    expect(parentFlow(sp('step-01.02:opt.03:try'))).toBe('step-01.02:opt')
  })

  it('should ignore plain step segments when resolving the parent', () => {
    expect(parentFlow(sp('step-01.02.03'))).toBeNull()
  })
})

describe('walkthroughFlow', () => {
  // A flow that nests opt > alt > (when | else) so order, level, stepnum and
  // the parent chain are all exercised in one traversal.
  const walkView = baseModel
    .views(({ dynamicView, $step }, _) =>
      _(
        dynamicView('walk').with(
          $step('a.child1 -> a.child2'),
          $step.opt(
            $step('a.child2 -> b.child1'),
            $step.alt(
              $step.when($step('b.child1 -> b.child2')),
              $step.else($step('b.child2 -> b.child1')),
            ),
          ),
          $step('b.child1 -> shopify'),
        ),
      )
    )
    .toLikeC4Model()
    .view('walk')
    .$view
  invariant(isDynamicView(walkView))

  // Flat, indented trace of the traversal — captures order, level, stepnum,
  // edge resolution and the parent chain in one readable artifact.
  const trace = (v: typeof walkView) => {
    const out: string[] = []
    walkthroughFlow(v, {
      subflow: (ctx) => {
        out.push(
          `${'  '.repeat(ctx.level)}<${ctx.type} ${ctx.subflow.id}> parent=${ctx.parent?.type ?? null}`,
        )
        return true
      },
      step: (ctx) => {
        out.push(
          `${'  '.repeat(ctx.level)}#${ctx.stepnum.global}/${ctx.stepnum.index} ${ctx.step}`
            + ` (${ctx.edge.source} -> ${ctx.edge.target}) parent=${ctx.parent?.type ?? null}`,
        )
      },
    })
    return out
  }

  it('walks the flow depth-first with correct stepnum / level / parent', () => {
    expect(trace(walkView)).toMatchInlineSnapshot(`
      [
        "#1/1 step-01 (a.child1 -> a.child2) parent=null",
        "<opt step-02:opt> parent=null",
        "  #2/1 step-02:opt.01 (a.child2 -> b.child1) parent=opt",
        "  <alt step-02:opt.02:alt> parent=opt",
        "    <alt-when step-02:opt.02:alt.01:when> parent=alt",
        "      #3/1 step-02:opt.02:alt.01:when.01 (b.child1 -> b.child2) parent=alt-when",
        "    <alt-else step-02:opt.02:alt.02:else> parent=alt",
        "      #4/1 step-02:opt.02:alt.02:else.01 (b.child2 -> b.child1) parent=alt-else",
        "#5/2 step-03 (b.child1 -> shopify) parent=null",
      ]
    `)
  })

  it('throws when the view has no flow', () => {
    const noFlow = { ...walkView, flow: undefined } as unknown as ComputedDynamicView
    expect(() => walkthroughFlow(noFlow, {})).toThrow('does not have a flow')
  })

  it('prunes a subtree when the subflow callback returns false', () => {
    const steps: string[] = []
    walkthroughFlow(walkView, {
      subflow: (ctx) => ctx.type !== 'opt',
      step: (ctx) => {
        steps.push(ctx.step)
      },
    })
    // Only the two top-level steps survive; everything inside `opt` is pruned.
    expect(steps).toMatchInlineSnapshot(`
      [
        "step-01",
        "step-03",
      ]
    `)
  })

  it('redirects descent when the subflow callback returns { next }', () => {
    const steps: string[] = []
    const onLeave = vi.fn()
    const altElse = vi.fn()
    walkthroughFlow(walkView, {
      subflow: {
        alt: ({ subflow }) => {
          return {
            next: subflow.flow[0],
            onLeave,
          }
        },
        'alt-else': altElse,
      },
      step: ({ step }) => {
        steps.push(step)
      },
    })
    // Inside `alt` only the first branch (`when`) is walked, never `else`.
    expect(steps).toMatchInlineSnapshot(`
      [
        "step-01",
        "step-02:opt.01",
        "step-02:opt.02:alt.01:when.01",
        "step-03",
      ]
    `)
    expect(onLeave).toHaveBeenCalledOnce()
    expect(altElse).not.toHaveBeenCalled()
  })

  it('invokes onLeave after a subflow and its children are walked', () => {
    const events: string[] = []
    walkthroughFlow(walkView, {
      subflow: (ctx) => {
        events.push(`enter ${ctx.type}`)
        return { onLeave: () => events.push(`leave ${ctx.type}`) }
      },
      step: (ctx) => {
        events.push(`step ${ctx.step}`)
      },
    })
    // Every `leave` is balanced and nests correctly around its children.
    expect(events).toMatchInlineSnapshot(`
      [
        "step step-01",
        "enter opt",
        "step step-02:opt.01",
        "enter alt",
        "enter alt-when",
        "step step-02:opt.02:alt.01:when.01",
        "leave alt-when",
        "enter alt-else",
        "step step-02:opt.02:alt.02:else.01",
        "leave alt-else",
        "leave alt",
        "leave opt",
        "step step-03",
      ]
    `)
  })

  it('still descends into subflows when only a step callback is given', () => {
    const steps: string[] = []
    walkthroughFlow(walkView, {
      step: (ctx) => {
        steps.push(ctx.step)
      },
    })
    expect(steps).toMatchInlineSnapshot(`
      [
        "step-01",
        "step-02:opt.01",
        "step-02:opt.02:alt.01:when.01",
        "step-02:opt.02:alt.02:else.01",
        "step-03",
      ]
    `)
  })

  it('visits subflows but no steps when only a subflow callback is given', () => {
    const subflows: string[] = []
    walkthroughFlow(walkView, {
      subflow: (ctx) => {
        subflows.push(ctx.type)
        return true
      },
    })
    expect(subflows).toMatchInlineSnapshot(`
      [
        "opt",
        "alt",
        "alt-when",
        "alt-else",
      ]
    `)
  })
})

describe('flowHelpers.isBefore', () => {
  // `isBefore` is "before *or equal*": it returns true when `step` sorts at or
  // ahead of `other` in the natural, hierarchical ordering of step paths.
  it('returns true for two equal steps (before-or-equal)', () => {
    expect(flowHelpers.isBefore(sp('step-01'), sp('step-01'))).toBe(true)
  })

  it('returns true when a step precedes a later sibling', () => {
    expect(flowHelpers.isBefore(sp('step-01'), sp('step-02'))).toBe(true)
  })

  it('returns false when a step follows an earlier sibling', () => {
    expect(flowHelpers.isBefore(sp('step-02'), sp('step-01'))).toBe(false)
  })

  it('orders numbers naturally, not lexicographically', () => {
    // Lexicographically "10" < "2", but natural ordering puts 2 before 10.
    expect(flowHelpers.isBefore(sp('step-01.2'), sp('step-01.10'))).toBe(true)
    expect(flowHelpers.isBefore(sp('step-01.10'), sp('step-01.2'))).toBe(false)
  })

  it('treats a parent flow as before any step nested within it', () => {
    expect(flowHelpers.isBefore(sp('step-02:opt'), sp('step-02:opt.01'))).toBe(true)
  })

  it('treats a nested step as not before its parent flow', () => {
    expect(flowHelpers.isBefore(sp('step-02:opt.01'), sp('step-02:opt'))).toBe(false)
  })

  it('compares hierarchically across sibling branches', () => {
    const whenStep = sp('step-02:opt.02:alt.01:when.01')
    const elseStep = sp('step-02:opt.02:alt.02:else.01')
    expect(flowHelpers.isBefore(whenStep, elseStep)).toBe(true)
    expect(flowHelpers.isBefore(elseStep, whenStep)).toBe(false)
  })

  it('places a top-level step before a step nested in a later subflow', () => {
    expect(flowHelpers.isBefore(sp('step-01'), sp('step-02:opt.01'))).toBe(true)
  })

  it('places a whole subflow subtree before a following top-level step', () => {
    expect(flowHelpers.isBefore(sp('step-02:opt.02:alt.02:else.01'), sp('step-03'))).toBe(true)
  })

  it('accepts subflows / steps given as `{ id }` objects', () => {
    expect(flowHelpers.isBefore({ id: sp('step-01') }, { id: sp('step-02') })).toBe(true)
    expect(flowHelpers.isBefore({ id: sp('step-02') }, { id: sp('step-01') })).toBe(false)
  })

  it('accepts a mix of string and `{ id }` arguments', () => {
    expect(flowHelpers.isBefore(sp('step-01'), { id: sp('step-02') })).toBe(true)
    expect(flowHelpers.isBefore({ id: sp('step-02') }, sp('step-01'))).toBe(false)
  })
})

describe('flowHelpers.includes', () => {
  // `includes` is prefix-based: a step is "inside" a flow when its path starts
  // with the flow's id. The data-first form takes the flow first
  // (`includes(flow, step)`); the curried form takes the step first
  // (`includes(step)(flow)`). Both answer "is `step` inside `flow`?".
  it('returns true for a step directly inside a flow', () => {
    expect(flowHelpers.includes({ id: sp('step-02:opt') }, sp('step-02:opt.01'))).toBe(true)
  })

  it('returns true for a deeply nested step inside an outer flow', () => {
    expect(flowHelpers.includes({ id: sp('step-02:opt') }, sp('step-02:opt.02:alt.01:when.01'))).toBe(true)
  })

  it('returns true for a step inside its innermost flow', () => {
    expect(
      flowHelpers.includes({ id: sp('step-02:opt.02:alt.01:when') }, sp('step-02:opt.02:alt.01:when.01')),
    ).toBe(true)
  })

  it('returns false for an unrelated top-level step', () => {
    expect(flowHelpers.includes({ id: sp('step-02:opt') }, sp('step-01'))).toBe(false)
  })

  it('returns false for a step in a sibling branch', () => {
    expect(
      flowHelpers.includes({ id: sp('step-02:opt.02:alt.01:when') }, sp('step-02:opt.02:alt.02:else.01')),
    ).toBe(false)
  })

  it('is reflexive — a flow is inside itself', () => {
    expect(flowHelpers.includes({ id: sp('step-02:opt') }, { id: sp('step-02:opt') })).toBe(true)
  })

  it('accepts the step given as an `{ id }` object', () => {
    expect(flowHelpers.includes({ id: sp('step-02:opt') }, { id: sp('step-02:opt.01') })).toBe(true)
  })

  it('supports the curried (data-last) form: includes(step)(flow)', () => {
    const stepInsideOpt = flowHelpers.includes(sp('step-02:opt.01'))
    expect(stepInsideOpt({ id: sp('step-02:opt') })).toBe(true)
    expect(stepInsideOpt({ id: sp('step-03:opt') })).toBe(false)
  })
})

describe('flowHelpers — against a computed view', () => {
  // A flow rich in nesting (alt > when > try{block, catch, finally{loop}}) so
  // the helpers are exercised against real, generated step paths rather than
  // hand-written strings.
  const view = baseModel
    .views(({ dynamicView, $step }, _) =>
      _(
        dynamicView('flow').with(
          $step('a.child1 -> a.child2'),
          $step.alt(
            $step.when(
              $step.try({
                try: [$step('a.child2 -> b.child1')],
                catch: [$step('a.child2 -> b.child2')],
                finally: [$step.loop($step('a.child2 -> b.child2'))],
              }),
            ),
          ),
        ),
      )
    )
    .toLikeC4Model()
    .view('flow')
    .$view
  invariant(isDynamicView(view))

  // Document order, as produced by the depth-first walkthrough.
  const order: StepPath[] = []
  walkthroughFlow(view, {
    step: ({ step }) => {
      order.push(step)
    },
  })

  it('isBefore agrees with walkthrough (document) order for every pair of steps', () => {
    invariant(order.length > 1, 'expected several steps in the flow')
    for (let i = 0; i < order.length; i++) {
      for (let j = 0; j < order.length; j++) {
        expect(flowHelpers.isBefore(order[i]!, order[j]!)).toBe(i <= j)
      }
    }
  })

  it('includes is true for a step and each of its ancestor flows', () => {
    let nestedChecks = 0
    for (const step of order) {
      for (const ancestor of flowAncestors(step)) {
        expect(flowHelpers.includes({ id: ancestor }, step)).toBe(true)
        nestedChecks++
      }
    }
    invariant(nestedChecks > 0, 'expected the flow to contain nested steps')
  })

  it('includes is false for a step and a flow that is not its ancestor', () => {
    const blockStep = sp('step-02:alt.01:when.01:try.01:block.01')
    expect(flowHelpers.includes({ id: sp('step-02:alt.01:when.01:try.02:catch') }, blockStep)).toBe(false)
    expect(flowHelpers.includes({ id: sp('step-02:alt') }, sp('step-01'))).toBe(false)
  })
})

describe('DynamicViewFlow.prevAndNext', () => {
  const prevNextView = baseModel
    .views(({ dynamicView, $step }, _) =>
      _(
        dynamicView('prevnext').with(
          $step('a.child1 -> a.child2'),
          $step.opt(
            $step('a.child2 -> b.child1'),
            $step.alt(
              $step.when($step('b.child1 -> b.child2')),
              $step.else($step('b.child2 -> b.child1')),
            ),
          ),
          $step('b.child1 -> shopify'),
        ),
      )
    )
    .toLikeC4Model()
    .view('prevnext')
    .$view
  invariant(isDynamicView(prevNextView))

  const flow = DynamicViewFlow.from(prevNextView)

  it('should return null for prev when step is first in flow', () => {
    const result = flow.prevAndNext(sp('step-01'))
    expect(result).toEqual({ prev: null, next: sp('step-02:opt.01') })
  })

  it('should return null for next when step is last in flow', () => {
    const result = flow.prevAndNext(sp('step-03'))
    expect(result).toEqual({ prev: sp('step-02:opt.02:alt.02:else.01'), next: null })
  })

  it('should return both prev and next for middle step', () => {
    const result = flow.prevAndNext(sp('step-02:opt.01'))
    expect(result).toEqual({ prev: sp('step-01'), next: sp('step-02:opt.02:alt.01:when.01') })
  })

  it('should navigate correctly through nested flows (excluding subflows)', () => {
    // Steps in order: step-01, step-02:opt.01, step-02:opt.02:alt.01:when.01, step-02:opt.02:alt.02:else.01, step-03
    const result1 = flow.prevAndNext(sp('step-02:opt.02:alt.01:when.01'))
    expect(result1).toEqual({ prev: sp('step-02:opt.01'), next: sp('step-02:opt.02:alt.02:else.01') })

    const result2 = flow.prevAndNext(sp('step-02:opt.02:alt.02:else.01'))
    expect(result2).toEqual({ prev: sp('step-02:opt.02:alt.01:when.01'), next: sp('step-03') })
  })

  it('should handle single step flow', () => {
    const singleStepView = baseModel
      .views(({ dynamicView, $step }, _) => _(dynamicView('single').with($step('a.child1 -> a.child2'))))
      .toLikeC4Model()
      .view('single')
      .$view
    invariant(isDynamicView(singleStepView))

    const singleFlow = DynamicViewFlow.from(singleStepView)
    const result = singleFlow.prevAndNext(sp('step-01'))
    expect(result).toEqual({ prev: null, next: null })
  })

  it('should handle flow with only nested steps', () => {
    const nestedView = baseModel
      .views(({ dynamicView, $step }, _) =>
        _(
          dynamicView('nested').with(
            $step.opt(
              $step('a.child1 -> a.child2'),
              $step('a.child2 -> b.child1'),
            ),
          ),
        )
      )
      .toLikeC4Model()
      .view('nested')
      .$view
    invariant(isDynamicView(nestedView))

    const nestedFlow = DynamicViewFlow.from(nestedView)
    const result1 = nestedFlow.prevAndNext(sp('step-01:opt.01'))
    expect(result1).toEqual({ prev: null, next: sp('step-01:opt.02') })

    const result2 = nestedFlow.prevAndNext(sp('step-01:opt.02'))
    expect(result2).toEqual({ prev: sp('step-01:opt.01'), next: null })
  })

  it('should handle complex nested flow with try-catch-finally', () => {
    const complexView = baseModel
      .views(({ dynamicView, $step }, _) =>
        _(
          dynamicView('complex').with(
            $step('a.child1 -> a.child2'),
            $step.try({
              try: [$step('a.child2 -> b.child1')],
              catch: [$step('a.child2 -> b.child2')],
              finally: [$step('b.child1 -> shopify')],
            }),
            $step('b.child1 -> webhook'),
          ),
        )
      )
      .toLikeC4Model()
      .view('complex')
      .$view
    invariant(isDynamicView(complexView))

    const complexFlow = DynamicViewFlow.from(complexView)
    // Steps: step-01, step-02:try.01:block.01, step-02:try.02:catch.01, step-02:try.03:finally.01, step-03
    const result1 = complexFlow.prevAndNext(sp('step-02:try.01:block.01'))
    expect(result1).toEqual({ prev: sp('step-01'), next: sp('step-02:try.02:catch.01') })

    const result2 = complexFlow.prevAndNext(sp('step-02:try.02:catch.01'))
    expect(result2).toEqual({ prev: sp('step-02:try.01:block.01'), next: sp('step-02:try.03:finally.01') })

    const result3 = complexFlow.prevAndNext(sp('step-02:try.03:finally.01'))
    expect(result3).toEqual({ prev: sp('step-02:try.02:catch.01'), next: sp('step-03') })
  })

  describe('with exclude (collapsed subflows)', () => {
    // The UI collapses subflows; `exclude` hides their steps from navigation.
    // An excluded subflow is still descended into, so a target inside one is
    // still found — only its *other* steps stop counting as prev/next.
    //
    // step-01                              first
    // opt                                  opt
    //   step-02:opt.01                     optStep
    //   alt                                alt
    //     when                             when
    //       step-02:opt.02:alt.01:when.01  whenStep
    //     else                             els
    //       step-02:opt.02:alt.02:else.01  elseStep
    // step-03                              last
    const first = sp('step-01')
    const opt = sp('step-02:opt')
    const optStep = sp('step-02:opt.01')
    const alt = sp('step-02:opt.02:alt')
    const when = sp('step-02:opt.02:alt.01:when')
    const whenStep = sp('step-02:opt.02:alt.01:when.01')
    const els = sp('step-02:opt.02:alt.02:else')
    const elseStep = sp('step-02:opt.02:alt.02:else.01')
    const last = sp('step-03')

    const collapse = (...ids: StepPath[]) => (subflow: { id: StepPath }) => ids.includes(subflow.id)

    it('hides every step of a collapsed subflow', () => {
      expect(flow.prevAndNext(first, collapse(opt))).toEqual({ prev: null, next: last })
      expect(flow.prevAndNext(last, collapse(opt))).toEqual({ prev: first, next: null })
    })

    it('hides only the collapsed nested subflow, keeping its siblings', () => {
      expect(flow.prevAndNext(optStep, collapse(alt))).toEqual({ prev: first, next: last })
      expect(flow.prevAndNext(last, collapse(alt))).toEqual({ prev: optStep, next: null })
    })

    it('hides a single collapsed branch of an alt', () => {
      expect(flow.prevAndNext(whenStep, collapse(els))).toEqual({ prev: optStep, next: last })
      expect(flow.prevAndNext(elseStep, collapse(when))).toEqual({ prev: optStep, next: last })
    })

    it('still finds the target when it sits inside a collapsed subflow', () => {
      // `when` is collapsed, but `whenStep` is the target — it is found anyway,
      // and navigation continues from the next *visible* step.
      expect(flow.prevAndNext(whenStep, collapse(when))).toEqual({ prev: optStep, next: elseStep })
      // Collapsing the outer `opt` hides its siblings too.
      expect(flow.prevAndNext(whenStep, collapse(opt))).toEqual({ prev: first, next: last })
    })

    it('keeps exclusion scoped to the collapsed subflow (reset on leave)', () => {
      // Nothing after `opt` is affected by `opt` being collapsed.
      expect(flow.prevAndNext(last, collapse(opt))).toEqual({ prev: first, next: null })
      expect(flow.prevAndNext(first, collapse(when))).toEqual({ prev: null, next: optStep })
    })

    it('behaves like the unfiltered call when exclude never matches', () => {
      expect(flow.prevAndNext(whenStep, () => false)).toEqual(flow.prevAndNext(whenStep))
      expect(flow.prevAndNext(first, collapse(sp('step-99:opt')))).toEqual(flow.prevAndNext(first))
    })

    it('leaves only top-level steps when every subflow is collapsed', () => {
      const collapseAll = () => true
      expect(flow.prevAndNext(first, collapseAll)).toEqual({ prev: null, next: last })
      expect(flow.prevAndNext(last, collapseAll)).toEqual({ prev: first, next: null })
    })

    it('matches the documented example — exclude everything but the alt', () => {
      // `flow.prevAndNext('02', s => s.id !== 'alt')` => { prev: '01', next: '04' }
      expect(flow.prevAndNext(whenStep, s => s.id !== alt)).toEqual({ prev: first, next: last })
    })

    it('keeps navigation inside the open branch when only ancestors stay expanded', () => {
      // The realistic UI case: only the ancestors of the active step stay open.
      const collapseAllBut = (target: StepPath) => (subflow: { id: StepPath }) => !flowHelpers.includes(subflow, target)
      expect(flow.prevAndNext(whenStep, collapseAllBut(whenStep))).toEqual({ prev: optStep, next: last })
      expect(flow.prevAndNext(elseStep, collapseAllBut(elseStep))).toEqual({ prev: optStep, next: last })
    })
  })

  describe('with a subflow as the target', () => {
    const first = sp('step-01')
    const opt = sp('step-02:opt')
    const optStep = sp('step-02:opt.01')
    const alt = sp('step-02:opt.02:alt')
    const last = sp('step-03')

    it('does not descend into the target subflow', () => {
      expect(flow.prevAndNext(opt)).toEqual({ prev: first, next: last })
    })

    it('resolves prev/next around a nested subflow target', () => {
      expect(flow.prevAndNext(alt)).toEqual({ prev: optStep, next: last })
    })
  })
})

describe('DynamicViewFlow.stepsBefore / stepsAfter', () => {
  // Both helpers return `AnyStep[]` — a mix of step paths (strings) and subflow
  // objects — so normalize everything to a path for readable assertions.
  const paths = (steps: DynamicViewFlow.AnyStep[]) => steps.map(s => typeof s === 'string' ? s : s.id)

  // 01
  // alt
  //   when
  //     02
  //   else
  //     03
  // 04
  const altView = baseModel
    .views(({ dynamicView, $step }, _) =>
      _(
        dynamicView('alt').with(
          $step('a.child1 -> a.child2'),
          $step.alt(
            $step.when($step('a.child2 -> b.child1')),
            $step.else($step('a.child2 -> b.child2')),
          ),
          $step('b.child1 -> shopify'),
        ),
      )
    )
    .toLikeC4Model()
    .view('alt')
    .$view
  invariant(isDynamicView(altView))

  const altFlow = DynamicViewFlow.from(altView)

  const step01 = sp('step-01')
  const alt = sp('step-02:alt')
  const when = sp('step-02:alt.01:when')
  const step02 = sp('step-02:alt.01:when.01')
  const els = sp('step-02:alt.02:else')
  const step03 = sp('step-02:alt.02:else.01')
  const step04 = sp('step-03')

  describe('stepsBefore', () => {
    it('returns nothing for the very first step', () => {
      expect(altFlow.stepsBefore(step01)).toEqual([])
    })

    it('stops at the target subflow, excluding it', () => {
      expect(paths(altFlow.stepsBefore(alt))).toEqual([step01])
    })

    it('includes the enclosing subflow of the target branch', () => {
      expect(paths(altFlow.stepsBefore(when))).toEqual([step01, alt])
    })

    it('walks only the branch that contains the target step', () => {
      expect(paths(altFlow.stepsBefore(step02))).toEqual([step01, alt, when])
    })

    it('includes earlier sibling branches of an alt', () => {
      expect(paths(altFlow.stepsBefore(step03))).toEqual([step01, alt, when, step02, els])
    })

    it('includes every branch of an alt when the target is after it', () => {
      expect(paths(altFlow.stepsBefore(step04))).toEqual([step01, alt, when, step02, els, step03])
    })

    it('returns everything for an unknown step path', () => {
      expect(paths(altFlow.stepsBefore(sp('step-99')))).toEqual([
        step01,
        alt,
        when,
        step02,
        els,
        step03,
        step04,
      ])
    })

    it('stepPathsBefore mirrors stepsBefore as plain paths', () => {
      expect(altFlow.stepPathsBefore(step03)).toEqual(paths(altFlow.stepsBefore(step03)))
    })
  })

  describe('stepsAfter', () => {
    it('returns everything after the very first step', () => {
      expect(paths(altFlow.stepsAfter(step01))).toEqual([alt, when, step02, els, step03, step04])
    })

    it('skips the contents of the target subflow', () => {
      expect(paths(altFlow.stepsAfter(alt))).toEqual([step04])
    })

    it('returns the following sibling branch when the target is a branch', () => {
      expect(paths(altFlow.stepsAfter(when))).toEqual([els, step03, step04])
    })

    it('continues from a step nested in a branch', () => {
      expect(paths(altFlow.stepsAfter(step02))).toEqual([els, step03, step04])
    })

    it('returns nothing for the last step', () => {
      expect(altFlow.stepsAfter(step04)).toEqual([])
    })

    it('returns nothing for an unknown step path', () => {
      expect(altFlow.stepsAfter(sp('step-99'))).toEqual([])
    })
  })

  describe('with try / catch / finally', () => {
    // 01
    // try
    //   block
    //     02
    //   catch
    //     03
    //   finally
    //     loop
    //       04
    // 05
    const tryView = baseModel
      .views(({ dynamicView, $step }, _) =>
        _(
          dynamicView('trycatch').with(
            $step('a.child1 -> a.child2'),
            $step.try({
              try: [$step('a.child2 -> b.child1')],
              catch: [$step('a.child2 -> b.child2')],
              finally: [$step.loop($step('b.child1 -> b.child2'))],
            }),
            $step('b.child1 -> shopify'),
          ),
        )
      )
      .toLikeC4Model()
      .view('trycatch')
      .$view
    invariant(isDynamicView(tryView))

    const tryFlow = DynamicViewFlow.from(tryView)

    const first = sp('step-01')
    const tryFlowId = sp('step-02:try')
    const block = sp('step-02:try.01:block')
    const blockStep = sp('step-02:try.01:block.01')
    const katch = sp('step-02:try.02:catch')
    const catchStep = sp('step-02:try.02:catch.01')
    const finallyFlow = sp('step-02:try.03:finally')
    const loop = sp('step-02:try.03:finally.01:loop')
    const loopStep = sp('step-02:try.03:finally.01:loop.01')
    const last = sp('step-03')

    it('stepsBefore walks earlier try branches when the target is inside one', () => {
      expect(paths(tryFlow.stepsBefore(catchStep))).toEqual([
        first,
        tryFlowId,
        block,
        blockStep,
        katch,
      ])
    })

    it('stepsBefore walks every try branch for a step after the try', () => {
      expect(paths(tryFlow.stepsBefore(last))).toEqual([
        first,
        tryFlowId,
        block,
        blockStep,
        katch,
        catchStep,
        finallyFlow,
        loop,
        loopStep,
      ])
    })

    it('stepsAfter descends through nested loop subflows', () => {
      expect(paths(tryFlow.stepsAfter(catchStep))).toEqual([
        finallyFlow,
        loop,
        loopStep,
        last,
      ])
    })

    it('stepsAfter skips the whole try subtree when the target is the try itself', () => {
      expect(paths(tryFlow.stepsAfter(tryFlowId))).toEqual([last])
    })

    it('stepsAfter skips only the nested loop when the target is the loop', () => {
      expect(paths(tryFlow.stepsAfter(loop))).toEqual([last])
    })

    it('stepsBefore and stepsAfter never overlap and never contain the target', () => {
      for (const path of tryFlow.paths) {
        const before = new Set(paths(tryFlow.stepsBefore(path)))
        const after = new Set(paths(tryFlow.stepsAfter(path)))
        expect(before.has(path)).toBe(false)
        expect(after.has(path)).toBe(false)
        for (const p of after) {
          expect(before.has(p)).toBe(false)
        }
      }
    })
  })
})
