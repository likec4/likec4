import { filter, forEach, pipe, reduce } from 'remeda'
import { isDeployedInstance } from '../../../model'
import { findConnectionsBetween, findConnectionsWithin } from '../../../model/connection/deployment'
import type { DeploymentElementModel, DeploymentNodeModel } from '../../../model/DeploymentElementModel'
import type { FqnExpr } from '../../../types'
import type { Elem, IncludePredicateCtx, PredicateExecutor } from '../_types'
import { cleanCrossBoundary, cleanRedundantRelationships } from '../clean-connections'
import type { StageInclude } from '../memory'
import { deploymentExpressionToPredicate } from '../utils'
import { applyElementPredicate } from './utils'

export const DeploymentRefPredicate: PredicateExecutor<FqnExpr.DeploymentRef> = {
  include: (ctx) => {
    const { expr, where } = ctx
    const el = ctx.model.element(expr.ref.deployment)

    if (isDeployedInstance(el)) {
      if (applyElementPredicate(el, where)) {
        ctx.stage.addExplicit(el)
        ctx.stage.connectWithExisting(el)
      }
      return ctx.stage
    }

    switch (true) {
      case expr.selector === 'expanded':
        includeDeployedNodeWithExpanded(el, ctx)
        break
      case expr.selector === 'children':
        includeDeployedNodeChildren(el, ctx)
        break
      case expr.selector === 'descendants':
        includeDeployedNodeDescendants(el, ctx)
        break
      default: {
        if (applyElementPredicate(el, where)) {
          ctx.stage.addExplicit(el)
          ctx.stage.connectWithExisting(el)
        }
      }
    }
    return ctx.stage
  },

  exclude: ({ expr, stage, memory, where }) => {
    const exprPredicate = deploymentExpressionToPredicate(expr)
    const toExclude = pipe(
      [...memory.elements],
      filter<DeploymentElementModel>(exprPredicate),
      applyElementPredicate(where),
    )
    stage.exclude(toExclude)
    return stage
  },
}

/**
 * include node.*
 */
function includeDeployedNodeChildren(
  node: DeploymentNodeModel,
  { stage, where }: IncludePredicateCtx,
) {
  const children = applyElementPredicate([...node.children()], where)
  if (children.length === 0) {
    return
  }
  stage.addImplicit(node)

  stage.addConnections(findConnectionsWithin(children))
  stage.connectWithExisting(children)

  stage.addExplicit(children)
}

/**
 * include node._
 */
function includeDeployedNodeWithExpanded(
  node: DeploymentNodeModel,
  { memory, stage, where }: IncludePredicateCtx,
) {
  stage.addImplicit(node)
  stage.connectWithExisting(node)

  const children = applyElementPredicate([...node.children()], where)
  let hasConnectionsWithVisible = false
  for (const child of children) {
    if (findConnectionsBetween(child, memory.elements).length > 0) {
      hasConnectionsWithVisible = true
      break
    }
  }

  if (hasConnectionsWithVisible) {
    stage.connectWithExisting(children, 'in')
    stage.addConnections(findConnectionsWithin(children))
    stage.connectWithExisting(children, 'out')
  }
  stage.addImplicit(children)

  if (stage.connections.length > 0) {
    stage.addExplicit(node)
  }
}

/**
 * include node.**
 */
function includeDeployedNodeDescendants(
  node: DeploymentNodeModel,
  { stage, where }: IncludePredicateCtx,
) {
  const dfs = (node: DeploymentNodeModel): DeploymentElementModel[] => {
    const children = [] as DeploymentElementModel[]
    for (const child of node.children()) {
      if (child.isDeploymentNode()) {
        children.push(...dfs(child))
      }
      if (applyElementPredicate(child, where)) {
        children.push(child)
      }
    }
    stage.connectWithExisting(children, 'in')
    stage.addConnections(findConnectionsWithin(children))
    stage.addImplicit(children)
    return children
  }

  const descendants = dfs(node)
  if (descendants.length === 0) {
    return
  }
  stage.connectWithExisting(descendants, 'out')

  const allConnected = findConnectedElements(stage)
  pipe(
    descendants,
    filter(desc => allConnected.has(desc)),
    forEach(desc => stage.addExplicit(desc)),
  )
}

function findConnectedElements(stage: StageInclude) {
  return pipe(
    stage.mergedConnections(),
    cleanCrossBoundary,
    cleanRedundantRelationships,
    reduce((acc, c) => {
      acc.add(c.source)
      acc.add(c.target)
      return acc
    }, new Set<Elem>()),
  )
}
