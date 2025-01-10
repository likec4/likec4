import { describe, expect, test } from 'vitest'
import { Builder } from '../../builder'
import { TestHelper } from './__test__/TestHelper'
import { toComputedEdges } from './utils'

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
      el('sys2.el1'),
    )
  )

describe('toComputedEdges', () => {
  test('pick label from exact relation (if single)', () => {
    const t = TestHelper.from(builder.model(({ rel }, m) =>
      m(
        rel('sys1', 'sys2', 'alpha'),
        rel('sys1', 'sys2.el1', 'beta'),
      )
    ))
    const state = t.processPredicates(
      t.$include('sys1 -> sys2'),
    )
    const [edge] = toComputedEdges(state.memory.connections)
    expect(edge).toMatchObject({
      'relations': [
        'rel1',
        'rel2',
      ],
      'label': 'alpha',
    })
  })

  test('dont pick label from exact relations (if multiple)', () => {
    const t = TestHelper.from(builder.model(({ rel }, m) =>
      m(
        rel('sys1', 'sys2', 'alpha'),
        rel('sys1', 'sys2', 'beta'),
      )
    ))
    const state = t.processPredicates(
      t.$include('sys1 -> sys2'),
    )
    const [edge] = toComputedEdges(state.memory.connections)
    expect(edge).toMatchObject({
      'relations': [
        'rel1',
        'rel2',
      ],
      'label': '[...]',
    })
  })
})
