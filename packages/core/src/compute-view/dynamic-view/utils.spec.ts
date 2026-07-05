// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { indexBy, mapValues, pipe, prop } from 'remeda'
import { describe, expect, it } from 'vitest'
import { Builder } from '../../builder/Builder'
import type { LikeC4Model } from '../../model'
import type { StepPath, ViewId } from '../../types'
import { findRelations } from './utils'

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
        color: 'blue',
        line: 'solid',
        head: 'open',
        tail: 'diamond',
      },
      responds: {
        technology: 'Webhook Response',
        color: 'red',
        line: 'dashed',
        head: 'normal',
        tail: 'odot',
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
  .views(({ view, $include }, _) =>
    _(
      view('index', $include('*')),
    )
  )

describe('findRelations', () => {
  const testFindRelationsOnModel = (model: LikeC4Model<any>) => {
    const a = model.element('a')
    const b = model.element('b')
    return findRelations(a, b, viewId)
  }

  it('should return empty object when no relationships found', () => {
    const model = baseModel.toLikeC4Model()

    const result = testFindRelationsOnModel(model)

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

  it('should return style from single relationship kind specification', () => {
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
      kind: 'requests',
      technology: 'HTTP Request',
      color: 'blue',
      line: 'solid',
      head: 'open',
      tail: 'diamond',
    })
  })

  it('should prefer explicit relationship arrow styles over kind specification', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('shopify', 'webhook', {
            kind: 'requests',
            head: 'normal',
            tail: 'odot',
          }),
        )
      )
      .toLikeC4Model()
    const shopify = model.element('shopify')
    const webhook = model.element('webhook')

    const result = findRelations(shopify, webhook, viewId)

    expect(result).toMatchObject({
      kind: 'requests',
      color: 'blue',
      line: 'solid',
      head: 'normal',
      tail: 'odot',
    })
  })

  it('should return technology when all relationships have same technology', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a.child1', 'b.child1', {
            technology: 'REST',
          }),
          rel('a.child2', 'b.child2', {
            technology: 'REST',
          }),
        )
      )
      .toLikeC4Model()

    const result = testFindRelationsOnModel(model)

    expect(result).toMatchObject({
      technology: 'REST',
    })
    expect(result.relations).toHaveLength(2)
  })

  it('should not return technology when multiple relationships have different technologies', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a.child1', 'b.child1', {
            technology: 'REST',
          }),
          rel('a.child2', 'b.child2', {
            technology: 'GraphQL',
          }),
        )
      )
      .toLikeC4Model()

    const result = testFindRelationsOnModel(model)

    expect(result).not.toHaveProperty('technology')
    expect(result.relations).toHaveLength(2)
  })

  it('should return description when all relationships have same description', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a.child1', 'b.child1', {
            description: { txt: 'Same description' },
          }),
          rel('a.child2', 'b.child2', {
            description: { txt: 'Same description' },
          }),
        )
      )
      .toLikeC4Model()

    const result = testFindRelationsOnModel(model)

    expect(result).toMatchObject({
      description: { txt: 'Same description' },
    })
    expect(result.relations).toHaveLength(2)
  })

  it('should not return description when multiple relationships have different descriptions', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a.child1', 'b.child1', {
            description: { txt: 'Description 1' },
          }),
          rel('a.child2', 'b.child2', {
            description: { txt: 'Description 2' },
          }),
        )
      )
      .toLikeC4Model()

    const result = testFindRelationsOnModel(model)

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

    const result = testFindRelationsOnModel(model)

    expect(result).toMatchObject({
      technology: 'HTTP Request',
      kind: 'requests',
    })
  })

  it('should return technology when multiple relationships have same technology from spec', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a.child1', 'b.child1', {
            kind: 'requests',
          }),
          rel('a.child2', 'b.child2', {
            kind: 'requests',
          }),
        )
      )
      .toLikeC4Model()

    const result = testFindRelationsOnModel(model)

    expect(result).toMatchObject({
      technology: 'HTTP Request',
      kind: 'requests',
    })
    expect(result.relations).toHaveLength(2)
  })

  it('should return style when multiple relationships share the same kind specification', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a.child1', 'b.child1', {
            kind: 'requests',
          }),
          rel('a.child2', 'b.child2', {
            kind: 'requests',
          }),
        )
      )
      .toLikeC4Model()

    const result = testFindRelationsOnModel(model)

    expect(result).toMatchObject({
      kind: 'requests',
      technology: 'HTTP Request',
      color: 'blue',
      line: 'solid',
      head: 'open',
      tail: 'diamond',
    })
    expect(result.relations).toHaveLength(2)
  })

  it('should not return style when multiple relationships have different kind specifications', () => {
    const model = baseModel
      .model(({ rel }, _) =>
        _(
          rel('a.child1', 'b.child1', {
            kind: 'requests',
          }),
          rel('a.child2', 'b.child2', {
            kind: 'responds',
          }),
        )
      )
      .toLikeC4Model()

    const result = testFindRelationsOnModel(model)

    expect(result).not.toHaveProperty('kind')
    expect(result).not.toHaveProperty('technology')
    expect(result).not.toHaveProperty('color')
    expect(result).not.toHaveProperty('line')
    expect(result).not.toHaveProperty('head')
    expect(result).not.toHaveProperty('tail')
    expect(result.relations).toHaveLength(2)
  })
})
