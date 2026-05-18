import { describe, expect, it } from 'vitest'
import { Builder } from '../../builder'
import { TestHelper } from '../element-view/__test__/TestHelper'
import { calcViewLayoutHash } from './view-hash'

const builder = Builder
  .specification({
    elements: {
      el: {},
    },
  })
  .model(({ el }, m) =>
    m(
      el('sys1'),
      el('sys2'),
    )
  )

describe('calcViewLayoutHash', () => {
  it('produces a hash for a view', () => {
    const view = builder
      .model(({ rel }, m) =>
        m(
          rel('sys1', 'sys2', 'alpha'),
        )
      )
      .views(v => v.view('test', v.$include('*')))
      .toLikeC4Model()
      .view('test').$view

    const hashed = calcViewLayoutHash(view)
    expect(hashed.hash).toBeDefined()
    expect(hashed.hash).not.toBe('')
  })

  it('does not collide with merged edges sharing same source/target', () => {
    const view = builder
      .model(({ rel }, m) =>
        m(
          rel('sys1', 'sys2', 'alpha'),
          rel('sys1', 'sys2', 'beta'),
        )
      )
      .views(v => v.view('test', v.$include('*')))
      .toLikeC4Model()
      .view('test').$view

    const hashed = calcViewLayoutHash(view)
    expect(hashed.hash).toBeDefined()
    expect(view.edges).toHaveLength(1)
    expect(view.edges[0]!.relations).toHaveLength(2)
  })

  it('does not collide with parallel edges sharing same source/target', () => {
    const view = builder
      .model(({ rel }, m) =>
        m(
          rel('sys1', 'sys2', 'alpha'),
        )
      )
      .views(v => v.view('test', v.$include('*')))
      .toLikeC4Model()
      .view('test').$view

    const singleEdge = view.edges[0]
    const parallelView = {
      ...view,
      edges: [
        { ...singleEdge, id: 'edge1' as any },
        { ...singleEdge, id: 'edge2' as any },
      ],
    }

    const hashedParallel = calcViewLayoutHash(parallelView as any)
    expect(hashedParallel.hash).toBeDefined()
    expect(hashedParallel.hash).not.toBe(
      calcViewLayoutHash({
        ...view,
        edges: [{ ...singleEdge, id: 'edge1' as any }],
      } as any).hash,
    )
  })

  it('produces stable hash', () => {
    const builder1 = builder
      .model(({ rel }, m) =>
        m(
          rel('sys1', 'sys2', 'alpha'),
        )
      )
    const view1 = builder1
      .views(v => v.view('test', v.$include('*')))
      .toLikeC4Model()
      .view('test').$view

    const hashed1 = calcViewLayoutHash(JSON.parse(JSON.stringify(view1)))
    const hashed2 = calcViewLayoutHash(JSON.parse(JSON.stringify(view1)))
    expect(hashed1.hash).toBe(hashed2.hash)
  })
})
