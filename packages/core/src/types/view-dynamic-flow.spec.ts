import { indexBy, mapValues, pipe, prop } from 'remeda'
import { describe, expect, it, vi } from 'vitest'
import { Builder } from '../builder/Builder'
import { invariant } from '../utils'
import { type ViewId, StepPath } from './scalar'
import { isDynamicView } from './view'
import type { ComputedDynamicView } from './view-computed'
import { flowAncestors, flowHelpers, parentFlow, walkthroughFlow } from './view-dynamic-flow'

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

describe('flowHelpers.isInside', () => {
  // `isInside` is prefix-based: a step is "inside" a flow when its path starts
  // with the flow's id. The data-first form takes the flow first
  // (`isInside(flow, step)`); the curried form takes the step first
  // (`isInside(step)(flow)`). Both answer "is `step` inside `flow`?".
  it('returns true for a step directly inside a flow', () => {
    expect(flowHelpers.isInside({ id: sp('step-02:opt') }, sp('step-02:opt.01'))).toBe(true)
  })

  it('returns true for a deeply nested step inside an outer flow', () => {
    expect(flowHelpers.isInside({ id: sp('step-02:opt') }, sp('step-02:opt.02:alt.01:when.01'))).toBe(true)
  })

  it('returns true for a step inside its innermost flow', () => {
    expect(
      flowHelpers.isInside({ id: sp('step-02:opt.02:alt.01:when') }, sp('step-02:opt.02:alt.01:when.01')),
    ).toBe(true)
  })

  it('returns false for an unrelated top-level step', () => {
    expect(flowHelpers.isInside({ id: sp('step-02:opt') }, sp('step-01'))).toBe(false)
  })

  it('returns false for a step in a sibling branch', () => {
    expect(
      flowHelpers.isInside({ id: sp('step-02:opt.02:alt.01:when') }, sp('step-02:opt.02:alt.02:else.01')),
    ).toBe(false)
  })

  it('is reflexive — a flow is inside itself', () => {
    expect(flowHelpers.isInside({ id: sp('step-02:opt') }, { id: sp('step-02:opt') })).toBe(true)
  })

  it('accepts the step given as an `{ id }` object', () => {
    expect(flowHelpers.isInside({ id: sp('step-02:opt') }, { id: sp('step-02:opt.01') })).toBe(true)
  })

  it('supports the curried (data-last) form: isInside(step)(flow)', () => {
    const stepInsideOpt = flowHelpers.isInside(sp('step-02:opt.01'))
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

  it('isInside is true for a step and each of its ancestor flows', () => {
    let nestedChecks = 0
    for (const step of order) {
      for (const ancestor of flowAncestors(step)) {
        expect(flowHelpers.isInside({ id: ancestor }, step)).toBe(true)
        nestedChecks++
      }
    }
    invariant(nestedChecks > 0, 'expected the flow to contain nested steps')
  })

  it('isInside is false for a step and a flow that is not its ancestor', () => {
    const blockStep = sp('step-02:alt.01:when.01:try.01:block.01')
    expect(flowHelpers.isInside({ id: sp('step-02:alt.01:when.01:try.02:catch') }, blockStep)).toBe(false)
    expect(flowHelpers.isInside({ id: sp('step-02:alt') }, sp('step-01'))).toBe(false)
  })
})
