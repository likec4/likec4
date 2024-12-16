import { filter, identity, isNonNullish, map, pipe } from 'remeda'
import { invariant } from '../../../errors'
import type { LikeC4DeploymentModel } from '../../../model'
import type { DeploymentConnectionModel } from '../../../model/connection/deployment'
import { findConnectionsBetween } from '../../../model/connection/deployment'
import { findConnectionsBetween as findModelConnectionsBetween } from '../../../model/connection/model'
import type { ConnectionModel } from '../../../model/connection/model/ConnectionModel'
import { DeploymentElementModel } from '../../../model/DeploymentElementModel'
import type { RelationshipModel } from '../../../model/RelationModel'
import type { AnyAux } from '../../../model/types'
import { FqnExpr, type RelationExpr } from '../../../types'
import { hasIntersection, intersection, union } from '../../../utils/set'
import type { ExcludePredicateCtx, PredicateCtx, PredicateExecutor } from '../_types'
import { deploymentExpressionToPredicate, resolveElements, resolveModelElements } from '../utils'
import { resolveAllImcomingRelations } from './relation-incoming'
import { resolveAllOutgoingRelations } from './relation-outgoing'

// const isRef = DeploymentElementExpression.isRef

export const resolveAscendingSiblings = (element: DeploymentElementModel) => {
  const siblings = new Set<DeploymentElementModel>()
  for (let sibling of element.ascendingSiblings()) {
    if (element.isInstance() && sibling.isDeploymentNode()) {
      // we flatten nodes that contain only one instance
      sibling = sibling.onlyOneInstance() ?? sibling
    }
    siblings.add(sibling)
  }
  return siblings
}

const resolveWildcard = (model: LikeC4DeploymentModel, nonWildcard: FqnExpr.DeploymentRef) => {
  const sources = resolveElements(model, nonWildcard)
  const [head, ...rest] = sources.map(s => resolveAscendingSiblings(s))
  if (head) {
    let targets = rest.length > 0 ? union(head, ...rest) : head
    return [sources, [...targets]] as const
  }
  return [sources, []] as const
}

export const DirectRelationPredicate: PredicateExecutor<RelationExpr.Direct> = {
  include: ({ expr, model, stage }) => {
    const sourceIsWildcard = FqnExpr.isWildcard(expr.source)
    const targetIsWildcard = FqnExpr.isWildcard(expr.target)

    let sources, targets

    switch (true) {
      case sourceIsWildcard && targetIsWildcard: {
        sources = [...model.instances()]
        targets = sources.slice()
        break
      }
      case targetIsWildcard && FqnExpr.isDeploymentRef(expr.source): {
        const [
          resolvedSources,
          resolvedTargets
        ] = resolveWildcard(model, expr.source)
        sources = resolvedSources
        targets = resolvedTargets
        break
      }
      case sourceIsWildcard && FqnExpr.isDeploymentRef(expr.target): {
        const [
          resolvedSources,
          resolvedTargets
        ] = resolveWildcard(model, expr.target)
        // Swap sources and targets
        sources = resolvedTargets
        targets = resolvedSources
        break
      }
      default: {
        invariant(FqnExpr.isDeploymentRef(expr.source), 'Inferrence failed - source should be a deployment ref')
        invariant(FqnExpr.isDeploymentRef(expr.target), 'Inferrence failed - target should be a deployment ref')
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

    if (stage.newConnections.length === 0) {
      return identity()
    }

    for (const c of stage.newConnections) {
      if (c.source.isInstance() && c.target.isInstance() && c.boundary) {
        stage.addImplicit(c.boundary)
      }
    }
    if (FqnExpr.isDeploymentRef(expr.source) && isNonNullish(expr.source.selector)) {
      stage.addImplicit(model.element(expr.source.ref.deployment))
    }
    if (FqnExpr.isDeploymentRef(expr.target) && isNonNullish(expr.target.selector)) {
      stage.addImplicit(model.element(expr.target.ref.deployment))
    }

    return stage
  },
  exclude: ({ expr, model, memory, stage }) => {
    // * -> *
    // Exclude all connections
    if (
      FqnExpr.isWildcard(expr.source)
      && FqnExpr.isWildcard(expr.target)
    ) {
      stage.excludeConnections(memory.connections)
      return stage
    }

    if (FqnExpr.isModelRef(expr.source) && FqnExpr.isModelRef(expr.target)) {
      const toExclude = resolveRelationsBetweenModelElements({
        source: expr.source,
        target: expr.target,
        expr,
        model
      })
      return excludeModelRelations(toExclude, { stage, memory })
    }

    if (FqnExpr.isModelRef(expr.source)) {
      if (FqnExpr.isWildcard(expr.target)) {
        const toExclude = resolveAllOutgoingRelations(model, expr.source)
        return excludeModelRelations(toExclude, { stage, memory })
      }
      const allOutgoing = resolveAllOutgoingRelations(model, expr.source)
      const isTarget = deploymentExpressionToPredicate(expr.target)
      return excludeModelRelations(
        allOutgoing,
        { stage, memory },
        c => isTarget(c.target)
      )
    }

    if (FqnExpr.isModelRef(expr.target)) {
      const toExclude = resolveAllImcomingRelations(model, expr.target)
      const isSource = deploymentExpressionToPredicate(expr.source)
      return excludeModelRelations(
        toExclude,
        { stage, memory },
        c => isSource(c.source)
      )
    }

    const isSource = deploymentExpressionToPredicate(expr.source)
    const isTarget = deploymentExpressionToPredicate(expr.target)

    const satisfies = (connection: DeploymentConnectionModel) => {
      return (isSource(connection.source) && isTarget(connection.target))
        || (expr.isBidirectional && isSource(connection.target) && isTarget(connection.source))
    }

    const toExclude = memory.connections.filter(satisfies)
    if (toExclude.length === 0) {
      return identity()
    }

    stage.excludeConnections(toExclude)
    return stage
  }
}

export function excludeModelRelations(
  relationsToExclude: ReadonlySet<RelationshipModel<AnyAux>>,
  { stage, memory }: Pick<ExcludePredicateCtx, 'stage' | 'memory'>,
  // Optional filter to scope the connections to exclude
  filterConnections: (c: DeploymentConnectionModel) => boolean = () => true
) {
  if (relationsToExclude.size === 0) {
    return stage
  }
  const toExclude = pipe(
    memory.connections,
    // Find connections that have at least one relation in common with the excluded relations
    filter(c => filterConnections(c) && hasIntersection(c.relations.model, relationsToExclude)),
    map(c =>
      c.clone({
        deployment: null,
        model: intersection(c.relations.model, relationsToExclude)
      })
    )
  )
  if (toExclude.length === 0) {
    return stage
  }
  return stage.excludeConnections(toExclude)
}

function resolveRelationsBetweenModelElements({
  source,
  target,
  expr,
  model
}: {
  source: FqnExpr.ModelRef
  target: FqnExpr.ModelRef
  expr: RelationExpr.Direct
  model: LikeC4DeploymentModel
}) {
  const sources = resolveModelElements(model, source)
  const targets = resolveModelElements(model, target)

  const dir = expr.isBidirectional ? 'both' : 'directed'

  const modelConnections = [] as ConnectionModel[]
  for (const source of sources) {
    modelConnections.push(...findModelConnectionsBetween(source, targets, dir))
  }

  return new Set(modelConnections.flatMap(c => [...c.relations]))
}
