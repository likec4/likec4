import { firstCursor, nextCursor } from '@likec4/core'
import { Builder } from '@likec4/core/builder'
import { _type, StepPath, StoryFlow } from '@likec4/core/types'
import type { ComputedStoryView } from '@likec4/core/types'
import { describe, expect, it } from 'vitest'
import { resolveSceneView } from './resolveSceneView'

// A real, `Builder`-computed model — not a hand-rolled stub — so this spec
// exercises the exact `model.findView` / `isDynamicView` / `$view` path
// production code runs, per the accessor `hooks/useLikeC4Model.ts` uses.
const model = Builder
  .specification({ elements: { service: {} } })
  .model(({ service }, _) => _(service('a'), service('b')))
  .views(({ view, dynamicView, $include, $step }, _) =>
    _(
      view('overview', 'Overview').with($include('*')),
      dynamicView('checkout', 'Checkout').with(
        $step('a -> b', { title: 'Step 1' }),
        $step('b -> a', { title: 'Step 2' }),
      ),
    )
  )
  .toLikeC4Model()

describe('resolveSceneView', () => {
  it('resolves a dynamic view to its processed view', () => {
    const resolved = resolveSceneView(model, 'checkout')
    expect(resolved).not.toBeNull()
    expect(resolved?.id).toBe('checkout')
  })

  it('returns null for a view that is not dynamic', () => {
    expect(resolveSceneView(model, 'overview')).toBeNull()
  })

  it('returns null for a view id absent from the model', () => {
    expect(resolveSceneView(model, 'does-not-exist')).toBeNull()
  })
})

describe('resolveSceneView: story descent end-to-end', () => {
  // Three scenes; the middle one is the real dynamic view built above. This
  // mirrors the fixture shape in `actor.spec.ts` / `packages/core/src/story/cursor.spec.ts`,
  // but points `SCENE_2` at a genuine `Builder`-computed dynamic view instead
  // of a hand-rolled stub — proving the whole chain (React accessor -> core
  // cursor) actually descends, not just the cursor math in isolation.
  const SCENE_1 = StepPath(1)
  const SCENE_2 = StepPath(2)
  const SCENE_3 = StepPath(3)

  const storyView = {
    [_type]: 'story',
    scenes: [
      { id: SCENE_1, view: 'overview', astPath: '/a' },
      { id: SCENE_2, view: 'checkout', astPath: '/b' },
      { id: SCENE_3, view: 'overview', astPath: '/c' },
    ],
  } as unknown as ComputedStoryView

  const flow = StoryFlow.from(storyView)
  const resolve = (viewId: string) => resolveSceneView(model, viewId)

  it('with the placeholder resolver, the dynamic scene reads as non-dynamic (today’s bug)', () => {
    const first = firstCursor(flow, () => null)
    expect(first).toEqual({ scene: SCENE_1, innerStep: null })

    const enteredScene2 = nextCursor(flow, () => null, first!)
    expect(enteredScene2).toEqual({ scene: SCENE_2, innerStep: null })
  })

  it('with the real resolver, next descends into the dynamic scene before advancing', () => {
    const first = firstCursor(flow, resolve)
    expect(first).toEqual({ scene: SCENE_1, innerStep: null })

    const enteredScene2 = nextCursor(flow, resolve, first!)
    expect(enteredScene2?.scene).toBe(SCENE_2)
    expect(enteredScene2?.innerStep).not.toBeNull()

    const secondInnerStep = nextCursor(flow, resolve, enteredScene2!)
    expect(secondInnerStep?.scene).toBe(SCENE_2)
    expect(secondInnerStep?.innerStep).not.toBeNull()
    expect(secondInnerStep?.innerStep).not.toBe(enteredScene2?.innerStep)

    const leftScene2 = nextCursor(flow, resolve, secondInnerStep!)
    expect(leftScene2).toEqual({ scene: SCENE_3, innerStep: null })
  })
})
