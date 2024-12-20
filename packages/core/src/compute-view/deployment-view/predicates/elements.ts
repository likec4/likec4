import { hasAtLeast, pipe, reduce } from 'remeda'
import { isDeployedInstance } from '../../../model'
import type { DeploymentConnectionModel } from '../../../model/connection/deployment'
import { findConnectionsBetween, findConnectionsWithin } from '../../../model/connection/deployment'
import type { DeploymentNodeModel } from '../../../model/DeploymentElementModel'
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
  { memory, stage }: IncludePredicateCtx,
) {
  const children = [...node.children()]
  if (children.length === 0) {
    return
  }
  stage.addExplicit(children)

  if (hasAtLeast(children, 2)) {
    stage.addConnections(findConnectionsWithin(children))
  }
  for (const child of children) {
    stage.addConnections(findConnectionsBetween(child, memory.elements))
  }
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

  const connections = [] as DeploymentConnectionModel[]

  for (const child of children) {
    stage.addImplicit(child)
    connections.push(
      ...findConnectionsBetween(child, memory.elements),
    )
  }

  if (connections.length > 0) {
    // First connections inside
    stage.addConnections([
      ...findConnectionsWithin(children),
      ...connections,
    ])
  }

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
  const descendants = [...node.descendants('desc')]
  if (descendants.length === 0) {
    return
  }
  for (const child of descendants) {
    stage.addImplicit(child)
  }

  if (hasAtLeast(descendants, 2)) {
    stage.addConnections(findConnectionsWithin(descendants))
  }

  stage.connectWithExisting(descendants)

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
