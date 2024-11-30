import { hasAtLeast } from 'remeda'
import { invariant } from '../../../errors'
import { findConnectionsBetween, findConnectionsWithin } from '../../../model/connection/deployment'
import type { DeployedInstanceModel, DeploymentNodeModel } from '../../../model/DeploymentElementModel'
import type { DeploymentElementExpression } from '../../../types'
import { deploymentExpressionToPredicate } from '../../utils/deploymentExpressionToPredicate'
import type { PredicateParams } from '../_types'
import type { Patch } from '../Memory'

export function includeDeploymentRef(params: PredicateParams<DeploymentElementExpression.Ref>): Patch {
  const { model, stage, expr } = params
  const el = model.element(expr.ref.id)

  if (el.isInstance()) {
    includeDeployedInstance(el, params)
    return stage.patch()
  }
  invariant(el.isDeploymentNode(), 'Type inference failed')
  switch (true) {
    case expr.isExpanded:
      includeDeployedNodeWithExpanded(el, params)
      break
    case expr.isChildren:
      includeDeployedNodeChildren(el, params)
      break
    default:
      includeDeployedNode(el, params)
      break
  }
  return stage.patch()
}

function includeDeployedInstance(
  instance: DeployedInstanceModel,
  { memory, stage }: PredicateParams<DeploymentElementExpression.Ref>
) {
  stage.addExplicit(instance)
  stage.addConnections(findConnectionsBetween(instance, memory.elements))
}

/**
 * include node
 */
function includeDeployedNode(
  node: DeploymentNodeModel,
  { memory, stage }: PredicateParams<DeploymentElementExpression.Ref>
) {
  stage.addConnections(findConnectionsBetween(node, memory.elements))
  stage.addExplicit(node)
}

/**
 * include node.*
 */
function includeDeployedNodeChildren(
  node: DeploymentNodeModel,
  { memory, stage }: PredicateParams<DeploymentElementExpression.Ref>
) {
  const children = node.children().toArray()

  for (const child of children) {
    stage.addExplicit(child)
    stage.addConnections(findConnectionsBetween(child, memory.elements))
  }
  if (hasAtLeast(children, 2)) {
    stage.addConnections(findConnectionsWithin(children))
  }
}

/**
 * include node._
 */
function includeDeployedNodeWithExpanded(
  node: DeploymentNodeModel,
  { memory, stage }: PredicateParams<DeploymentElementExpression.Ref>
) {
  const children = node.children().toArray()
  for (const child of children) {
    const found = findConnectionsBetween(child, memory.elements)
    if (found.length > 1) {
      stage.addConnections(found)
      stage.addExplicit(child)
    }
  }

  // any connections added?
  if (stage.hasConnections()) {
    stage.addConnections(findConnectionsWithin(children)).forEach((c) => {
      stage.addExplicit([c.source, c.target])
    })
  }

  stage.addConnections(
    findConnectionsBetween(node, memory.elements)
  )
  if (stage.hasConnections()) {
    stage.addExplicit(node)
  }
}

export function excludeDeploymentRef({ stage, memory, expr }: PredicateParams<DeploymentElementExpression.Ref>): Patch {
  const exprPredicate = deploymentExpressionToPredicate(expr)
  stage.exclude([...memory.elements].filter(exprPredicate))
  return stage.patch()
}
