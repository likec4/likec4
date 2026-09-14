import { describe, test } from 'vitest'
import { Builder } from '../../../builder'
import { TestHelper } from './TestHelper'

const builder = Builder
  .specification({
    elements: {
      el: {},
    },
    deployments: {
      env: {},
      node: {},
    },
  })
  .model(({ el }, _) =>
    _(
      el('sys1'),
      el('sys2'),
    )
  )
  .deployment(({ env, node, instanceOf, rel }, _) =>
    _(
      env('prod').with(
        node('n1').with(
          instanceOf('i1', 'sys1'),
        ),
        node('n2').with(
          instanceOf('i2', 'sys2'),
        ),
        node('n3'),
      ),
      rel('prod.n1', 'prod.n2', { title: 'syncs', isBidirectional: true }),
      rel('prod.n1', 'prod.n3', 'notifies'),
    )
  )

describe('bidirectional deployment relations', () => {
  test('are included from the declared target', () => {
    const t = TestHelper.from(builder)
    const view = t.computeView(
      t.$include('prod.n1'),
      t.$include('-> prod.n2'),
    )
    t.expect(view).toHaveEdges('prod.n1 -> prod.n2')
  })

  test('are included from the declared source', () => {
    const t = TestHelper.from(builder)
    const view = t.computeView(
      t.$include('prod.n2'),
      t.$include('-> prod.n1'),
    )
    t.expect(view).toHaveEdges('prod.n1 -> prod.n2')
  })

  test('unidirectional relations stay incoming-only', () => {
    const t = TestHelper.from(builder)
    const view = t.computeView(
      t.$include('prod.n3'),
      t.$include('-> prod.n1'),
    )
    t.expect(view).toHaveEdges()
  })

  test('are excluded from the declared source', () => {
    const t = TestHelper.from(builder)
    const view = t.computeView(
      t.$include('prod.**'),
      t.$exclude('-> prod.n1'),
    )
    t.expect(view).toHaveEdges('prod.n1 -> prod.n3')
  })
})
