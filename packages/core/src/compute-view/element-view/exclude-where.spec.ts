// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, it } from 'vitest'
import { Builder } from '../../builder'
import type { AnyTypes, ElementViewBuilder, ElementViewRulesBuilder, Types, ViewPredicate } from '../../builder'
import { FqnExpr, RelationExpr } from '../../types'
import type { Expression, WhereOperator } from '../../types'
import { TestHelper } from './__test__/TestHelper'

type ElementExpr<T extends AnyTypes> = ViewPredicate.Expression<T> | Expression<Types.ToAux<T>>

function includeWhere<T extends AnyTypes>(
  expr: ElementExpr<T>,
  condition: WhereOperator<Types.ToAux<T>>,
): ElementViewRulesBuilder<T> {
  return (b: ElementViewBuilder<T>) => {
    const parsed = b.$expr(expr)
    if (FqnExpr.is(parsed)) {
      return b.include({
        where: {
          expr: parsed,
          condition,
        },
      })
    }
    if (RelationExpr.is(parsed)) {
      return b.include({
        where: {
          expr: parsed,
          condition,
        },
      })
    }
    throw new Error('Expected an element or relationship expression')
  }
}

function excludeWhere<T extends AnyTypes>(
  expr: ElementExpr<T>,
  condition: WhereOperator<Types.ToAux<T>>,
): ElementViewRulesBuilder<T> {
  return (b: ElementViewBuilder<T>) => {
    const parsed = b.$expr(expr)
    if (FqnExpr.is(parsed)) {
      return b.exclude({
        where: {
          expr: parsed,
          condition,
        },
      })
    }
    if (RelationExpr.is(parsed)) {
      return b.exclude({
        where: {
          expr: parsed,
          condition,
        },
      })
    }
    throw new Error('Expected an element or relationship expression')
  }
}

describe('element view exclude where', () => {
  const builder = Builder
    .specification({
      elements: {
        app: {},
        database: {},
      },
      relationships: {
        async: {},
        sync: {},
      },
      metadataKeys: ['lifecycle', 'owner', 'team', 'protocol', 'regions'],
    })
    .model(({ app, database }, m) =>
      m(
        app('client', { metadata: { owner: 'web', team: 'web' } }),
        app('api', { metadata: { owner: 'platform', team: 'core', regions: ['eu', 'us'] } }),
        database('db', { metadata: { lifecycle: 'deprecated', owner: 'data', team: 'core' } }),
        app('legacy', { metadata: { lifecycle: 'deprecated', owner: 'legacy', team: 'legacy' } }),
        app('unowned', { metadata: { team: 'core' } }),
      )
    )
    .model(({ rel }, m) =>
      m(
        rel('client', 'api', { title: 'call', kind: 'sync', metadata: { protocol: 'https' } }),
        rel('api', 'db', { title: 'write', kind: 'async', metadata: { protocol: 'http' } }),
        rel('legacy', 'api', { title: 'legacy call', kind: 'sync', metadata: { protocol: 'http' } }),
        rel('api', 'unowned', { title: 'audit', kind: 'sync', metadata: { protocol: 'grpc' } }),
      )
    )

  const t = TestHelper.from(builder)

  it('excludes elements by metadata value and removes their relationships', () => {
    t.expectComputedView(
      t.$include('*'),
      excludeWhere('*', { metadata: { key: 'lifecycle', value: 'deprecated' } }),
    ).toHave({
      nodes: ['client', 'api', 'unowned'],
      edges: ['client -> api', 'api -> unowned'],
    })
  })

  it('excludes elements without required metadata', () => {
    t.expectComputedView(
      t.$include('*'),
      excludeWhere('*', { not: { metadata: { key: 'owner' } } }),
    ).toHave({
      nodes: ['client', 'legacy', 'api', 'db'],
      edges: ['client -> api', 'api -> db', 'legacy -> api'],
    })
  })

  it('matches array metadata values when excluding elements', () => {
    t.expectComputedView(
      t.$include('*'),
      excludeWhere('*', { metadata: { key: 'regions', value: 'eu' } }),
    ).toHave({
      nodes: ['client', 'db', 'legacy', 'unowned'],
      edges: [],
    })
  })

  it('excludes relationships by kind without removing explicitly included endpoints', () => {
    t.expectComputedView(
      t.$include('client', 'api', 'db'),
      t.$include('client -> api'),
      t.$include('api -> db'),
      excludeWhere('api -> db', { kind: 'async' }),
    ).toHave({
      nodes: ['client', 'api', 'db'],
      edges: ['client -> api'],
    })
  })

  it('excludes relationships by relationship metadata', () => {
    t.expectComputedView(
      includeWhere('* -> *', { metadata: { key: 'protocol' } }),
      excludeWhere('* -> *', { metadata: { key: 'protocol', value: 'http' } }),
    ).toHave({
      nodes: ['client', 'api', 'unowned'],
      edges: ['client -> api', 'api -> unowned'],
    })
  })

  it('excludes relationships by source metadata', () => {
    t.expectComputedView(
      t.$include('* -> *'),
      excludeWhere('* -> *', {
        participant: 'source',
        operator: { metadata: { key: 'team', value: 'legacy' } },
      }),
    ).toHave({
      nodes: ['client', 'api', 'db', 'unowned'],
      edges: ['client -> api', 'api -> db', 'api -> unowned'],
    })
  })
})
