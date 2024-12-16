import { hasAtLeast } from 'remeda'
import { invariant } from '../../../errors'
import { findConnectionsBetween, findConnectionsWithin } from '../../../model/connection/deployment'
import type { DeploymentConnectionModel } from '../../../model/connection/deployment'
import type { DeployedInstanceModel, DeploymentNodeModel } from '../../../model/DeploymentElementModel'
import type { FqnExpr } from '../../../types'
import type { IncludePredicateCtx, PredicateCtx, PredicateExecutor } from '../_types'
import { deploymentExpressionToPredicate } from '../utils'

export const DeploymentRefPredicate: PredicateExecutor<FqnExpr.DeploymentRef> = {
  include: (ctx) => {
    const { expr } = ctx
    const el = ctx.model.element(expr.ref.deployment)

    if (el.isInstance()) {
      includeDeployedInstance(el, ctx)
      return ctx.stage
    }
    invariant(el.isDeploymentNode(), 'Type inference failed')
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
      default:
        includeDeployedNode(el, ctx)
        break
    }
    return ctx.stage
  },

  exclude: ({ expr, stage, memory }) => {
    const exprPredicate = deploymentExpressionToPredicate(expr)
    stage.exclude([...memory.elements].filter(exprPredicate))
    return stage
  }
}

function includeDeployedInstance(
  instance: DeployedInstanceModel,
  { memory, stage }: IncludePredicateCtx
) {
  stage.addExplicit(instance)
  stage.addConnections(findConnectionsBetween(instance, memory.elements))
}

/**
 * include node
 */
function includeDeployedNode(
  node: DeploymentNodeModel,
  { memory, stage }: IncludePredicateCtx
) {
  stage.addExplicit(node)
  stage.addConnections(findConnectionsBetween(node, memory.elements))
}

/**
 * include node.*
 */
function includeDeployedNodeChildren(
  node: DeploymentNodeModel,
  { memory, stage }: PredicateCtx
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
  { memory, stage }: IncludePredicateCtx
) {
  const children = [...node.children()]
  stage.addImplicit(node)

  const connections = [] as DeploymentConnectionModel[]

  for (const child of children) {
    const found = findConnectionsBetween(child, memory.elements)
    if (found.length > 0) {
      // on first connection, add node as explicit
      if (connections.length === 0) {
        stage.addExplicit(node)
      }
      stage.addExplicit(child)
      connections.push(...found)
    }
  }

  if (connections.length > 0) {
    // First connections inside
    stage.addConnections([
      ...findConnectionsWithin(children),
      ...connections
    ])
  }

  stage.addConnections(
    findConnectionsBetween(node, memory.elements)
  )
}

/**
 * include node.**
 */
function includeDeployedNodeDescendants(
  node: DeploymentNodeModel,
  { memory, stage }: IncludePredicateCtx
) {
  const descendants = [...node.descendants()]
  if (descendants.length === 0) {
    return
  }
  for (const child of descendants) {
    if (child.isInstance()) {
      stage.addExplicit(child)
    } else {
      stage.addImplicit(child)
    }
  }

  if (hasAtLeast(descendants, 2)) {
    stage.addConnections(findConnectionsWithin(descendants))
  }

  for (const child of descendants) {
    stage.addConnections(findConnectionsBetween(child, memory.elements))
  }
}
