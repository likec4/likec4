import { identity } from 'remeda'
import { invariant } from '../../../errors'
import type { LikeC4DeploymentModel } from '../../../model'
import { findConnectionsBetween } from '../../../model/connection/deployment'
import type { DeploymentConnectionModel } from '../../../model/DeploymentConnectionModel'
import { DeploymentElementModel } from '../../../model/DeploymentElementModel'
import { DeploymentElementExpression, type DeploymentRelationExpression } from '../../../types/deployments'
import { deploymentExpressionToPredicate } from '../../utils/deploymentExpressionToPredicate'
import type { PredicateExecutor } from '../_types'

export function resolveElements(model: LikeC4DeploymentModel, expr: DeploymentElementExpression.Ref) {
  const ref = model.element(expr.ref)
  if (ref.isDeploymentNode()) {
    if (expr.isChildren) {
      return [...ref.children()]
    }
    if (expr.isExpanded) {
      return [
        ref,
        ...ref.children()
      ]
    }
  }
  return [ref]
}

const isRef = DeploymentElementExpression.isRef

export const DirectRelationPredicate: PredicateExecutor<DeploymentRelationExpression.Direct> = {
  include: (expr, { model, stage }) => {
    const sourceIsWildcard = DeploymentElementExpression.isWildcard(expr.source)
    const targetIsWildcard = DeploymentElementExpression.isWildcard(expr.target)

    let sources, targets

    switch (true) {
      case sourceIsWildcard && targetIsWildcard: {
        sources = [...model.instances()]
        targets = sources
        break
      }
      case targetIsWildcard && isRef(expr.source): {
        const source = model.element(expr.source.ref)
        sources = resolveElements(model, expr.source)
        const instanceInSources = sources.some(s => s.isInstance())
        targets = [] as DeploymentElementModel[]
        for (const s of source.ascendingSiblings()) {
          targets.push(s)
          if (s.isDeploymentNode() && instanceInSources) {
            for (const i of s.instances()) {
              targets.push(i)
            }
          }
        }
        break
      }
      case sourceIsWildcard && isRef(expr.target): {
        const target = model.element(expr.target.ref)
        targets = resolveElements(model, expr.target)
        const instanceInTargets = targets.some(t => t.isInstance())
        sources = [] as DeploymentElementModel[]
        for (const t of target.ascendingSiblings()) {
          sources.push(t)
          if (t.isDeploymentNode() && instanceInTargets) {
            for (const i of t.instances()) {
              sources.push(i)
            }
          }
        }
        break
      }
      default: {
        invariant(isRef(expr.source), 'Type inference failed')
        invariant(isRef(expr.target), 'Type inference failed')
        sources = resolveElements(model, expr.source)
        targets = resolveElements(model, expr.target)
      }
    }

    if (sources.length === 0 || targets.length === 0) {
      return identity()
    }

    const dir = expr.isBidirectional ? 'both' : 'directed'
    for (const source of sources) {
      stage.addConnections(findConnectionsBetween(source, targets, dir))
    }

    if (stage.connections.length === 0) {
      return identity()
    }

    for (const c of stage.connections) {
      if (c.boundary) {
        stage.addImplicit(c.boundary)
      }
    }
    if (isRef(expr.source) && (expr.source.isChildren || expr.source.isExpanded)) {
      stage.addImplicit(model.element(expr.source.ref))
    }
    if (isRef(expr.target) && (expr.target.isChildren || expr.target.isExpanded)) {
      stage.addImplicit(model.element(expr.target.ref))
    }

    return stage.patch()
  },
  exclude: (expr, { memory, stage }) => {
    const sourceIsWildcard = DeploymentElementExpression.isWildcard(expr.source)
    const targetIsWildcard = DeploymentElementExpression.isWildcard(expr.target)
    if (sourceIsWildcard && targetIsWildcard) {
      stage.excludeConnections(memory.connections)
      return stage.patch()
    }

    const isSource = deploymentExpressionToPredicate(expr.source)
    const isTarget = deploymentExpressionToPredicate(expr.target)

    const satisfies = (connection: DeploymentConnectionModel) => {
      return isSource(connection.source) && isTarget(connection.target)
        || (expr.isBidirectional && isSource(connection.target) && isTarget(connection.source))
    }

    const toExclude = memory.connections.filter(satisfies)
    if (toExclude.length === 0) {
      return identity()
    }

    stage.excludeConnections(toExclude)
    return stage.patch()
  }
}
