import { identity, isNonNullish } from 'remeda'
import { invariant } from '../../../errors'
import type { LikeC4DeploymentModel } from '../../../model'
import { findConnectionsBetween } from '../../../model/connection/deployment'
import type { DeploymentConnectionModel } from '../../../model/connection/deployment'
import { DeploymentElementModel } from '../../../model/DeploymentElementModel'
import { DeploymentElementExpression, type DeploymentRelationExpression } from '../../../types/deployments'
import type { PredicateExecutor } from '../_types'
import { deploymentExpressionToPredicate, resolveElements } from '../utils'

const isRef = DeploymentElementExpression.isRef

const resolveIfWildcard = (model: LikeC4DeploymentModel, nonWildcard: DeploymentElementExpression.Ref) => {
  const source = model.element(nonWildcard.ref)
  const sources = resolveElements(model, nonWildcard)
  const instanceInSources = source.isInstance() || sources.some(s => s.isInstance())
  const targets = [] as DeploymentElementModel[]
  for (const s of source.ascendingSiblings()) {
    if (s.isDeploymentNode() && instanceInSources) {
      for (const i of s.instances()) {
        targets.push(i)
      }
    }
    targets.push(s)
  }
  return [sources, targets] as const
}

export const DirectRelationPredicate: PredicateExecutor<DeploymentRelationExpression.Direct> = {
  include: (expr, { model, stage }) => {
    const sourceIsWildcard = DeploymentElementExpression.isWildcard(expr.source)
    const targetIsWildcard = DeploymentElementExpression.isWildcard(expr.target)

    let sources, targets

    switch (true) {
      case sourceIsWildcard && targetIsWildcard: {
        sources = [...model.instances()]
        targets = sources.slice()
        break
      }
      case targetIsWildcard && isRef(expr.source): {
        const [
          resolvedSources,
          resolvedTargets
        ] = resolveIfWildcard(model, expr.source)
        sources = resolvedSources
        targets = resolvedTargets
        break
      }
      case sourceIsWildcard && isRef(expr.target): {
        const [
          resolvedSources,
          resolvedTargets
        ] = resolveIfWildcard(model, expr.target)
        // Swap sources and targets
        sources = resolvedTargets
        targets = resolvedSources
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
      if (c.source.isInstance() && c.target.isInstance() && c.boundary) {
        stage.addImplicit(c.boundary)
      }
    }
    if (isRef(expr.source) && isNonNullish(expr.source.selector)) {
      stage.addImplicit(model.element(expr.source.ref))
    }
    if (isRef(expr.target) && isNonNullish(expr.target.selector)) {
      stage.addImplicit(model.element(expr.target.ref))
    }

    return stage.patch()
  },
  exclude: (expr, { memory, stage }) => {
    // * -> *
    // Exclude all connections
    if (
      DeploymentElementExpression.isWildcard(expr.source)
      && DeploymentElementExpression.isWildcard(expr.target)
    ) {
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
