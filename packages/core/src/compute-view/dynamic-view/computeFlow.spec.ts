import { map, prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import { Builder } from '../../builder/Builder'
import type { ComputedDynamicView, StepPath } from '../../types'
import { invariant } from '../../utils'
import { computeFlow } from './computeFlow'

/**
 * Flow with all kinds of subflows. Everything is visible by default; passing
 * `subflows` only narrows the branches of the `alt`/`try` it selects into.
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

const allEdges = [
  'step-01',
  'step-02:loop.01',
  'step-02:loop.02',
  'step-02:loop.03:try.01:block.01',
  'step-02:loop.03:try.01:block.02:opt.01',
  'step-02:loop.03:try.02:catch.01',
  'step-02:loop.04:alt.01:when.01',
  'step-02:loop.04:alt.02:when.01',
  'step-02:loop.05',
  'step-03',
]

describe('computeFlow', () => {
  it('shows every step when no subflows are selected', () => {
    const view = fixtureView()
    const { nodes, edges } = computeFlow({ view, subflows: [] })

    // All branches/sections are visible by default
    expect(map(edges, prop('id'))).toEqual(allEdges)
    expect(map(nodes, prop('id'))).toEqual(['A', 'B', 'C', 'D'])
  })

  it('shows every step when subflows is omitted', () => {
    const view = fixtureView()
    expect(map(computeFlow({ view }).edges, prop('id'))).toEqual(allEdges)
  })

  it('narrows a `try` to the requested section, leaving other containers untouched', () => {
    const view = fixtureView()
    // Selecting `catch` hides the sibling `try-block`, but the unrelated `alt`
    // still shows both of its branches.
    expect(edgeIds(view, sp('step-02:loop.03:try.02:catch'))).toEqual([
      'step-01',
      'step-02:loop.01',
      'step-02:loop.02',
      // try-block hidden (sibling of selected `catch`)
      'step-02:loop.03:try.02:catch.01',
      'step-02:loop.04:alt.01:when.01',
      'step-02:loop.04:alt.02:when.01',
      'step-02:loop.05',
      'step-03',
    ])
  })

  it('narrows a `try` to the `try-block`, hiding the `catch`', () => {
    const view = fixtureView()
    expect(edgeIds(view, sp('step-02:loop.03:try.01:block'))).toEqual([
      'step-01',
      'step-02:loop.01',
      'step-02:loop.02',
      'step-02:loop.03:try.01:block.01',
      'step-02:loop.03:try.01:block.02:opt.01',
      // catch hidden (sibling of selected `try-block`)
      'step-02:loop.04:alt.01:when.01',
      'step-02:loop.04:alt.02:when.01',
      'step-02:loop.05',
      'step-03',
    ])
  })

  it('narrows an `alt` to the requested branch, leaving other containers untouched', () => {
    const view = fixtureView()
    // Selecting the second branch hides the first; the unrelated `try` still
    // shows all of its sections.
    expect(edgeIds(view, sp('step-02:loop.04:alt.02:when'))).toEqual([
      'step-01',
      'step-02:loop.01',
      'step-02:loop.02',
      'step-02:loop.03:try.01:block.01',
      'step-02:loop.03:try.01:block.02:opt.01',
      'step-02:loop.03:try.02:catch.01',
      // first branch hidden (sibling of selected second branch)
      'step-02:loop.04:alt.02:when.01',
      'step-02:loop.05',
      'step-03',
    ])
  })

  it('shows multiple `alt` branches when several are requested', () => {
    const view = fixtureView()
    expect(edgeIds(view, sp('step-02:loop.04:alt.01:when', 'step-02:loop.04:alt.02:when'))).toEqual(allEdges)
  })

  it('narrows node inEdges/outEdges to the visible subset', () => {
    const view = fixtureView()

    // By default C receives `B -> C` both in the try-block and in the second
    // alt branch.
    const cDefault = computeFlow({ view, subflows: [] }).nodes.find(n => n.id === 'C')!
    expect(cDefault.inEdges).toEqual([
      'step-02:loop.03:try.01:block.01',
      'step-02:loop.04:alt.02:when.01',
    ])
    expect(cDefault.outEdges).toEqual([])

    // Selecting the first alt branch hides the second, dropping its edge into C.
    const cWithAlt = computeFlow({ view, subflows: sp('step-02:loop.04:alt.01:when') })
      .nodes.find(n => n.id === 'C')!
    expect(cWithAlt.inEdges).toEqual(['step-02:loop.03:try.01:block.01'])
  })

  it('keeps parent sections visible when a nested subflow is requested', () => {
    // try at root: block ['A -> B'], catch ['B -> A', opt('A -> A')]
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

    // Everything visible by default
    expect(edgeIds(view)).toEqual([
      'step-01:try.01:block.01',
      'step-01:try.02:catch.01',
      'step-01:try.02:catch.02:opt.01',
    ])

    // Requesting the nested `opt` keeps its parent `catch` section visible
    // (it encloses the request), while the sibling `try-block` is hidden.
    expect(edgeIds(view, sp('step-01:try.02:catch.02:opt'))).toEqual([
      'step-01:try.02:catch.01',
      'step-01:try.02:catch.02:opt.01',
    ])

    // Requesting `catch` directly yields the same result.
    expect(edgeIds(view, sp('step-01:try.02:catch'))).toEqual([
      'step-01:try.02:catch.01',
      'step-01:try.02:catch.02:opt.01',
    ])
  })
})
