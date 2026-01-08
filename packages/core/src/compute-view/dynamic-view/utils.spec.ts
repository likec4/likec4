import { describe, expect, it } from 'vitest'
import type { ViewId } from '../../types'
import { Builder } from '../../builder/Builder'
import { findRelations } from './utils'

const viewId = 'view' as ViewId

describe('findRelations', () => {
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
        el('a'),
        el('b'),
        el('shopify'),
        el('webhook'),
      )
    )

  it('should return empty object when no relationships found', () => {
    const model = baseModel.toLikeC4Model()
    const a = model.element('a')
    const b = model.element('b')

    const result = findRelations(a, b, viewId)

    expect(result).toEqual({})
  })

  it('should return single relationship properties including technology and description', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('shopify', 'webhook', {
            title: 'requests',
            technology: 'HTTP Request Override',
            description: { txt: 'Makes HTTP request' },
            color: 'blue',
            line: 'solid',
          }),
        )
      )
      .toLikeC4Model()
    const shopify = model.element('shopify')
    const webhook = model.element('webhook')

    const result = findRelations(shopify, webhook, viewId)

    expect(result).toMatchObject({
      title: 'requests',
      technology: 'HTTP Request Override',
      description: { txt: 'Makes HTTP request' },
      color: 'blue',
      line: 'solid',
    })
    expect(result.relations).toHaveLength(1)
  })

  it('should return technology from single relationship even without explicit technology', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('shopify', 'webhook', {
            kind: 'requests',
          }),
        )
      )
      .toLikeC4Model()
    const shopify = model.element('shopify')
    const webhook = model.element('webhook')

    const result = findRelations(shopify, webhook, viewId)

    expect(result).toMatchObject({
      technology: 'HTTP Request',
    })
  })

  it('should return technology when all relationships have same technology', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a', 'b', {
            technology: 'REST',
          }),
        )
      )
      .toLikeC4Model()
    const a = model.element('a')
    const b = model.element('b')

    const result = findRelations(a, b, viewId)

    expect(result).toMatchObject({
      technology: 'REST',
    })
  })

  it('should not return technology when multiple relationships have different technologies', () => {
    const model = specs
      .model(({ el, rel }, _) =>
        _(
          el('parent1').with(
            el('child1'),
            el('child2'),
          ),
          el('parent2').with(
            el('child1'),
            el('child2'),
          ),
          rel('parent1.child1', 'parent2.child1', {
            technology: 'REST',
          }),
          rel('parent1.child2', 'parent2.child2', {
            technology: 'GraphQL',
          }),
        )
      )
      .toLikeC4Model()
    const parent1 = model.element('parent1')
    const parent2 = model.element('parent2')

    const result = findRelations(parent1, parent2, viewId)

    expect(result).not.toHaveProperty('technology')
    expect(result.relations).toHaveLength(2)
  })

  it('should return description when all relationships have same description', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a', 'b', {
            description: { txt: 'Same description' },
          }),
        )
      )
      .toLikeC4Model()
    const a = model.element('a')
    const b = model.element('b')

    const result = findRelations(a, b, viewId)

    expect(result).toMatchObject({
      description: { txt: 'Same description' },
    })
  })

  it('should not return description when multiple relationships have different descriptions', () => {
    const model = specs
      .model(({ el, rel }, _) =>
        _(
          el('parent1').with(
            el('child1'),
            el('child2'),
          ),
          el('parent2').with(
            el('child1'),
            el('child2'),
          ),
          rel('parent1.child1', 'parent2.child1', {
            description: { txt: 'Description 1' },
          }),
          rel('parent1.child2', 'parent2.child2', {
            description: { txt: 'Description 2' },
          }),
        )
      )
      .toLikeC4Model()
    const parent1 = model.element('parent1')
    const parent2 = model.element('parent2')

    const result = findRelations(parent1, parent2, viewId)

    expect(result).not.toHaveProperty('description')
    expect(result.relations).toHaveLength(2)
  })

  it('should handle mixed explicit and spec-based technology', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a', 'b', {
            kind: 'requests',
          }),
        )
      )
      .toLikeC4Model()
    const a = model.element('a')
    const b = model.element('b')

    const result = findRelations(a, b, viewId)

    expect(result).toMatchObject({
      technology: 'HTTP Request',
      kind: 'requests',
    })
  })

  it('should return technology when multiple relationships have same technology from spec', () => {
    const model = specs
      .model(({ el, rel }, _) =>
        _(
          el('parent1').with(
            el('child1'),
            el('child2'),
          ),
          el('parent2').with(
            el('child1'),
            el('child2'),
          ),
          rel('parent1.child1', 'parent2.child1', {
            kind: 'requests',
          }),
          rel('parent1.child2', 'parent2.child2', {
            kind: 'requests',
          }),
        )
      )
      .toLikeC4Model()
    const parent1 = model.element('parent1')
    const parent2 = model.element('parent2')

    const result = findRelations(parent1, parent2, viewId)

    expect(result).toMatchObject({
      technology: 'HTTP Request',
      kind: 'requests',
    })
    expect(result.relations).toHaveLength(2)
  })
})
