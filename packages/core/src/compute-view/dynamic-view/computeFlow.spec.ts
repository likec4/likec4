import { map, prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import { Builder } from '../../builder/Builder'
import type { ComputedDynamicView, StepPath } from '../../types'
import { invariant } from '../../utils'
import { computeFlow } from './computeFlow'

/**
 * Flow with all kinds of subflows. Default visibility (from `compute`):
 * - `loop`, `try`, `try-block`, `opt`, `alt` and the first `alt` branch are
 *   visible by default
 * - `try-catch` and non-first `alt` branches are hidden until requested
 */
function fixtureView(): ComputedDynamicView {
  const view = Builder
    .specification({ elements: ['el'] })
    .model(({ el }, _) =>
      _(
        el('A'),
        el('B'),
        el('C'),
        el('D'),
      )
    )
    .views(({ dynamicView, $step }, _) =>
      _(
        dynamicView('test').with(
          $step('A -> B'),
          $step.loop(
            'B -> B',
            $step('A -> B'),
            $step.try({
              try: [
                'B -> C',
                $step.opt('A -> A'),
              ],
              catch: ['B -> A'],
            }),
            $step.alt(
              $step.when('B -> A'),
              $step.when('B -> C'),
            ),
            $step('B -> B'),
          ),
          $step('D -> A'),
        ),
      )
    )
    .toLikeC4Model()
    .view('test')
    .$view
  invariant(view._type === 'dynamic')
  return view
}

const sp = (...ids: string[]) => ids as StepPath[]

const edgeIds = (view: ComputedDynamicView, subflows: StepPath[] = []) =>
  map(computeFlow({ view, subflows }).edges, prop('id'))

describe('computeFlow', () => {
  it('shows default-visible steps when no subflows are selected', () => {
    const view = fixtureView()
    const { nodes, edges } = computeFlow({ view, subflows: [] })

    // Everything except the hidden `catch` and the non-first `alt` branch
    expect(map(edges, prop('id'))).toEqual([
      'step-01',
      'step-02:loop.01',
      'step-02:loop.02',
      'step-02:loop.03:try.01:block.01',
      'step-02:loop.03:try.01:block.02:opt.01',
      // `step-02:loop.04:alt.01:when.01` — first branch is visible by default
      'step-02:loop.04:alt.01:when.01',
      'step-02:loop.05',
      'step-03',
    ])
    // All four actors participate in default-visible steps
    expect(map(nodes, prop('id'))).toEqual(['A', 'B', 'C', 'D'])
  })

  it('ignores section `visible` flags once a `try` section is explicitly selected', () => {
    const view = fixtureView()
    // Requesting only the (hidden) `catch` suppresses the default-visible
    // `try-block`: a `try` shows only its explicitly requested sections.
    expect(edgeIds(view, sp('step-02:loop.03:try.02:catch'))).toEqual([
      'step-01',
      'step-02:loop.01',
      'step-02:loop.02',
      // no `step-02:loop.03:try.01:block.*` — try-block suppressed
      'step-02:loop.03:try.02:catch.01',
      'step-02:loop.04:alt.01:when.01',
      'step-02:loop.05',
      'step-03',
    ])
  })

  it('shows `try-block` alongside `catch` when both sections are requested', () => {
    const view = fixtureView()
    expect(edgeIds(view, sp('step-02:loop.03:try.01:block', 'step-02:loop.03:try.02:catch'))).toEqual([
      'step-01',
      'step-02:loop.01',
      'step-02:loop.02',
      'step-02:loop.03:try.01:block.01',
      'step-02:loop.03:try.01:block.02:opt.01',
      'step-02:loop.03:try.02:catch.01',
      'step-02:loop.04:alt.01:when.01',
      'step-02:loop.05',
      'step-03',
    ])
  })

  it('ignores branch `visible` flags once an `alt` branch is explicitly selected', () => {
    const view = fixtureView()
    // Requesting only the (hidden) second branch hides the default-visible
    // first branch: an `alt` shows only its explicitly requested branches.
    expect(edgeIds(view, sp('step-02:loop.04:alt.02:when'))).toEqual([
      'step-01',
      'step-02:loop.01',
      'step-02:loop.02',
      'step-02:loop.03:try.01:block.01',
      'step-02:loop.03:try.01:block.02:opt.01',
      // no `step-02:loop.04:alt.01:when.01` — first branch suppressed
      'step-02:loop.04:alt.02:when.01',
      'step-02:loop.05',
      'step-03',
    ])
  })

  it('shows multiple `alt` branches when several are explicitly requested', () => {
    const view = fixtureView()
    expect(edgeIds(view, sp('step-02:loop.04:alt.01:when', 'step-02:loop.04:alt.02:when'))).toEqual([
      'step-01',
      'step-02:loop.01',
      'step-02:loop.02',
      'step-02:loop.03:try.01:block.01',
      'step-02:loop.03:try.01:block.02:opt.01',
      'step-02:loop.04:alt.01:when.01',
      'step-02:loop.04:alt.02:when.01',
      'step-02:loop.05',
      'step-03',
    ])
  })

  it('narrows node inEdges/outEdges to the visible subset', () => {
    const view = fixtureView()

    // C only receives `B -> C` in the (visible) try-block and in the (hidden)
    // second alt branch.
    const cDefault = computeFlow({ view, subflows: [] }).nodes.find(n => n.id === 'C')!
    expect(cDefault.inEdges).toEqual(['step-02:loop.03:try.01:block.01'])
    expect(cDefault.outEdges).toEqual([])

    const cWithAlt = computeFlow({ view, subflows: sp('step-02:loop.04:alt.02:when') })
      .nodes.find(n => n.id === 'C')!
    expect(cWithAlt.inEdges).toEqual([
      'step-02:loop.03:try.01:block.01',
      'step-02:loop.04:alt.02:when.01',
    ])
  })

  it('gates a nested subflow behind its hidden ancestor', () => {
    // `catch` is hidden by default and contains a default-visible `opt`.
    const view = Builder
      .specification({ elements: ['el'] })
      .model(({ el }, _) => _(el('A'), el('B')))
      .views(({ dynamicView, $step }, _) =>
        _(
          dynamicView('test').with(
            $step.try({
              try: ['A -> B'],
              catch: [
                $step('B -> A'),
                $step.opt('A -> A'),
              ],
            }),
          ),
        )
      )
      .toLikeC4Model()
      .view('test')
      .$view
    invariant(view._type === 'dynamic')

    // Only the try-block is visible by default
    expect(edgeIds(view)).toEqual(['step-01:try.01:block.01'])

    // Requesting the nested `opt` alone reaches nothing: selecting a subflow
    // inside the `try` switches it to explicit-only mode (suppressing the
    // try-block), yet `catch` itself was not requested, so the `opt` nested
    // within it is never reached.
    expect(edgeIds(view, sp('step-01:try.02:catch.02'))).toEqual([])

    // Requesting `catch` shows its leaf step and the default-visible `opt`
    // inside it; the try-block is suppressed (explicit-only).
    expect(edgeIds(view, sp('step-01:try.02:catch'))).toEqual([
      'step-01:try.02:catch.01',
      'step-01:try.02:catch.02:opt.01',
    ])
  })
})
