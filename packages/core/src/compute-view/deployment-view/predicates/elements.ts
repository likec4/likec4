import { pipe, reduce } from 'remeda'
import { isDeployedInstance } from '../../../model'
import { findConnectionsBetween, findConnectionsWithin } from '../../../model/connection/deployment'
import type { DeploymentElementModel, DeploymentNodeModel } from '../../../model/DeploymentElementModel'
import type { FqnExpr } from '../../../types'
import type { Elem, IncludePredicateCtx, PredicateExecutor } from '../_types'
import { cleanCrossBoundary, cleanRedundantRelationships } from '../clean-connections'
import type { StageInclude } from '../memory'
import { deploymentExpressionToPredicate } from '../utils'

export const DeploymentRefPredicate: PredicateExecutor<FqnExpr.DeploymentRef> = {
  include: (ctx) => {
    const { expr } = ctx
    const el = ctx.model.element(expr.ref.deployment)

    if (isDeployedInstance(el)) {
      ctx.stage.addExplicit(el)
      ctx.stage.connectWithExisting(el)
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
        ctx.stage.addExplicit(el)
        ctx.stage.connectWithExisting(el)
      }
    }
    return ctx.stage
  },

  exclude: ({ expr, stage, memory }) => {
    const exprPredicate = deploymentExpressionToPredicate(expr)
    stage.exclude([...memory.elements].filter(exprPredicate))
    return stage
  },
}

/**
 * include node.*
 */
function includeDeployedNodeChildren(
  node: DeploymentNodeModel,
  { stage }: IncludePredicateCtx,
) {
  const children = [...node.children()]
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
  { memory, stage }: IncludePredicateCtx,
) {
  const children = [...node.children()]
  stage.addImplicit(node)
  stage.connectWithExisting(node)

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
  { stage }: IncludePredicateCtx,
) {
  const dfs = (node: DeploymentNodeModel): DeploymentElementModel[] => {
    const children = [] as DeploymentElementModel[]
    for (const child of node.children()) {
      if (child.isDeploymentNode()) {
        children.push(...dfs(child))
      }
      children.push(child)
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
  // stage.addImplicit(descendants)

  const allconnected = findConnectedElements(stage)
  descendants.forEach((desc) => {
    if (allconnected.has(desc)) {
      stage.addExplicit(desc)
    }
  })
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
