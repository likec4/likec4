// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { describe, it } from 'vitest'
import { Builder } from '../../../../builder'
import type {
  AnyTypes,
  DeploymentRulesBuilderOp,
  DeploymentViewBuilder,
  Types,
  ViewPredicate,
} from '../../../../builder'
import type { WhereOperator } from '../../../../types'
import { TestHelper } from '../../__test__/TestHelper'

type DeploymentWhereExpr<T extends AnyTypes> = Extract<Types.ToExpression<T>, { where: unknown }>
type DeploymentExpr<T extends AnyTypes> = ViewPredicate.DeploymentExpression<T> | Types.ToExpression<T>

function excludeWhere<T extends AnyTypes>(
  expr: DeploymentExpr<T>,
  condition: WhereOperator<Types.ToAux<T>>,
): DeploymentRulesBuilderOp<T> {
  return (b: DeploymentViewBuilder<T>) =>
    b.exclude({
      where: {
        expr: b.$expr(expr) as DeploymentWhereExpr<T>['where']['expr'],
        condition,
      },
    } as DeploymentWhereExpr<T>)
}

describe('deployment view exclude where metadata', () => {
  const builder = Builder
    .specification({
      elements: {
        app: {},
        database: {},
      },
      deployments: {
        node: {},
      },
      relationships: {
        async: {},
        sync: {},
      },
      metadataKeys: ['lifecycle', 'protocol', 'zone'],
    })
    .model(({ app, database, rel }, m) =>
      m(
        app('client', { metadata: { zone: 'model-public' } }),
        app('api', { metadata: { zone: 'public' } }),
        database('db', { metadata: { zone: 'public' } }),
        app('legacy'),
        rel('client', 'api', { title: 'call', kind: 'sync', metadata: { protocol: 'https' } }),
        rel('api', 'db', { title: 'write', kind: 'async', metadata: { protocol: 'http' } }),
        rel('api', 'legacy', { title: 'notify', kind: 'sync', metadata: { protocol: 'grpc' } }),
      )
    )
    .deployment((_, d) =>
      d(
        _.node('prod').with(
          _.instanceOf('client', 'client'),
          _.instanceOf('api', 'api', { metadata: { lifecycle: 'active', zone: 'public' } }),
          _.instanceOf('db', 'db', { metadata: { lifecycle: 'deprecated', zone: 'restricted' } }),
          _.instanceOf('legacy', 'legacy', { metadata: { lifecycle: 'deprecated', zone: 'restricted' } }),
        ),
      )
    )

  const t = TestHelper.from(builder)

  it('excludes deployment instances by metadata value', () => {
    t.expectComputedView(
      t.$include('prod.*'),
      excludeWhere('prod.*', { metadata: { key: 'lifecycle', value: 'deprecated' } }),
    ).toHave({
      nodes: ['prod.client', 'prod.api'],
      edges: ['prod.client -> prod.api'],
    })
  })

  it('excludes deployment relationships by relationship metadata', () => {
    t.expectComputedView(
      t.$include('* -> *'),
      excludeWhere('* -> *', { metadata: { key: 'protocol', value: 'http' } }),
    ).toHave({
      nodes: ['prod.client', 'prod.api', 'prod.legacy'],
      edges: ['prod.client -> prod.api', 'prod.api -> prod.legacy'],
    })
  })

  it('excludes deployment relationships by source metadata', () => {
    t.expectComputedView(
      t.$include('* -> *'),
      excludeWhere('* -> *', {
        participant: 'source',
        operator: { metadata: { key: 'lifecycle', value: 'active' } },
      }),
    ).toHave({
      nodes: ['prod.client', 'prod.api'],
      edges: ['prod.client -> prod.api'],
    })
  })

  it('falls back to logical element metadata when an instance has no metadata', () => {
    t.expectComputedView(
      t.$include('* -> *'),
      excludeWhere('* -> *', {
        participant: 'source',
        operator: { metadata: { key: 'zone', value: 'model-public' } },
      }),
    ).toHave({
      nodes: ['prod.api', 'prod.db', 'prod.legacy'],
      edges: ['prod.api -> prod.db', 'prod.api -> prod.legacy'],
    })
  })

  it('uses deployment instance metadata instead of logical element metadata', () => {
    t.expectComputedView(
      t.$include('* -> *'),
      excludeWhere('* -> *', {
        participant: 'target',
        operator: { metadata: { key: 'zone', value: 'public' } },
      }),
    ).toHave({
      nodes: ['prod.api', 'prod.db', 'prod.legacy'],
      edges: ['prod.api -> prod.db', 'prod.api -> prod.legacy'],
    })
  })

  it('excludes deployment relationships by target metadata', () => {
    t.expectComputedView(
      t.$include('* -> *'),
      excludeWhere('* -> *', {
        participant: 'target',
        operator: { metadata: { key: 'zone', value: 'restricted' } },
      }),
    ).toHave({
      nodes: ['prod.client', 'prod.api'],
      edges: ['prod.client -> prod.api'],
    })
  })
})
