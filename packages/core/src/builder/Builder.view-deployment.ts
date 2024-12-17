import { isString } from 'remeda'
import { type ExpressionV2, type Fqn } from '../types'
import type { AnyTypes, Types } from './_types'
import type { LikeC4ViewBuilder, ViewPredicate } from './Builder.view-common'
import type { ViewsBuilder } from './Builder.views'

export interface DeploymentViewBuilder<T extends AnyTypes>
  extends LikeC4ViewBuilder<T, T['DeploymentFqn'], Types.ToExpression<T>>
{
}

export type DeploymentRulesBuilderOp<Types extends AnyTypes> = (
  b: DeploymentViewBuilder<Types>
) => DeploymentViewBuilder<Types>

export interface AddDeploymentViewRules<Id extends string> {
  with<S extends AnyTypes>(
    ...rules: DeploymentRulesBuilderOp<S>[]
  ): (builder: ViewsBuilder<S>) => ViewsBuilder<Types.AddView<S, Id>>
}

/**
 * Chainable builder to create element
 */
export interface AddDeploymentViewHelper {
  <
    const Id extends string,
    T extends AnyTypes
  >(
    id: Id
  ): AddDeploymentViewRules<Id> & {
    (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>
  }

  <
    const Id extends string,
    T extends AnyTypes
  >(
    id: Id,
    bulder: (b: DeploymentViewBuilder<T>) => DeploymentViewBuilder<T>
  ): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>

  <
    const Id extends string,
    T extends AnyTypes
  >(
    id: Id,
    propsOrTitle: T['NewViewProps'] | string
  ): AddDeploymentViewRules<Id> & {
    (builder: ViewsBuilder<T>): ViewsBuilder<Types.AddView<T, Id>>
  }

  <
    const Id extends string,
    T extends AnyTypes
  >(
    id: Id,
    propsOrTitle: T['NewViewProps'] | string,
    bulder: (b: DeploymentViewBuilder<T>) => DeploymentViewBuilder<T>
  ): (builder: ViewsBuilder<T>) => ViewsBuilder<Types.AddView<T, Id>>
}

export function $deploymentExpr<T extends AnyTypes>(
  expr: ViewPredicate.DeploymentExpression<T> | ExpressionV2
): Types.ToExpression<T> {
  if (!isString(expr)) {
    return expr as any
  }
  const asTypedDeploymentExpression = (expr: ExpressionV2): Types.ToExpression<T> => {
    return expr as any
  }

  if (expr === '*') {
    return asTypedDeploymentExpression({ wildcard: true })
  }
  if (expr.startsWith('->')) {
    if (expr.endsWith('->')) {
      return asTypedDeploymentExpression({
        inout: $deploymentExpr(expr.replace(/->/g, '').trim()) as any
      })
    }
    return asTypedDeploymentExpression({
      incoming: $deploymentExpr(expr.replace('-> ', '')) as any
    })
  }
  if (expr.endsWith(' ->')) {
    return asTypedDeploymentExpression({
      outgoing: $deploymentExpr(expr.replace(' ->', '')) as any
    })
  }
  if (expr.includes(' <-> ')) {
    const [source, target] = expr.split(' <-> ')
    return asTypedDeploymentExpression({
      source: $deploymentExpr(source) as any,
      target: $deploymentExpr(target) as any,
      isBidirectional: true
    })
  }
  if (expr.includes(' -> ')) {
    const [source, target] = expr.split(' -> ')
    return asTypedDeploymentExpression({
      source: $deploymentExpr(source) as any,
      target: $deploymentExpr(target) as any
    })
  }
  if (expr.endsWith('._')) {
    return asTypedDeploymentExpression({
      ref: {
        deployment: expr.replace('._', '') as Fqn
      },
      selector: 'expanded'
    })
  }
  if (expr.endsWith('.**')) {
    return asTypedDeploymentExpression({
      ref: {
        deployment: expr.replace('.**', '') as Fqn
      },
      selector: 'descendants'
    })
  }
  if (expr.endsWith('.*')) {
    return asTypedDeploymentExpression({
      ref: {
        deployment: expr.replace('.*', '') as Fqn
      },
      selector: 'children'
    })
  }
  return asTypedDeploymentExpression({
    ref: {
      deployment: expr as any as Fqn
    }
  })
}
