import { hasAtLeast } from 'remeda'
import { invariant } from '../../../errors'
import { findConnectionsBetween, findConnectionsWithin } from '../../../model/connection/deployment'
import type { DeploymentConnectionModel } from '../../../model/DeploymentConnectionModel'
import type { DeployedInstanceModel, DeploymentNodeModel } from '../../../model/DeploymentElementModel'
import type { DeploymentElementExpression } from '../../../types'
import { deploymentExpressionToPredicate } from '../../utils/deploymentExpressionToPredicate'
import type { PredicateCtx, PredicateExecutor } from '../_types'

export const DeploymentRefPredicate: PredicateExecutor<DeploymentElementExpression.Ref> = {
  include: (expr, ctx) => {
    const el = ctx.model.element(expr.ref.id)

    if (el.isInstance()) {
      includeDeployedInstance(el, ctx)
      return ctx.stage.patch()
    }
    invariant(el.isDeploymentNode(), 'Type inference failed')
    switch (true) {
      case expr.isExpanded:
        includeDeployedNodeWithExpanded(el, ctx)
        break
      case expr.isChildren:
        includeDeployedNodeChildren(el, ctx)
        break
      default:
        includeDeployedNode(el, ctx)
        break
    }
    return ctx.stage.patch()
  },

  exclude: (expr, { stage, memory }) => {
    const exprPredicate = deploymentExpressionToPredicate(expr)
    stage.exclude(memory.elements.values().filter(exprPredicate).toArray())
    return stage.patch()
  }
}

function includeDeployedInstance(
  instance: DeployedInstanceModel,
  { memory, stage }: PredicateCtx
) {
  stage.addExplicit(instance)
  stage.addConnections(findConnectionsBetween(instance, memory.elements))
}

/**
 * include node
 */
function includeDeployedNode(
  node: DeploymentNodeModel,
  { memory, stage }: PredicateCtx
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
  const children = node.children().toArray()
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
  { memory, stage }: PredicateCtx
) {
  const children = node.children().toArray()
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
