import { flatMap } from 'remeda'
import { DeploymentExpression as Expr } from '../../types/deployments'
import { LikeC4DeploymentGraph } from '../LikeC4DeploymentGraph'
import type { DeploymentViewComputeCtx } from './compute'

type DeploymentElement = LikeC4DeploymentGraph.Element

export function includeDeploymentRef(ctx: DeploymentViewComputeCtx, { ref, ...expr }: Expr.Ref) {
  const currentElements = [...ctx.resolvedElements]

  let element
  if ('node' in ref) {
    const node = ctx.graph.node(ref.node)
    if (expr.isExpanded) {
      // if element.* is in currentElements,
      // it could be added as implicit - make it explicit
      if (ctx.isImplicit(node)) {
        ctx.addElement(node)
      }

      const implicits = ctx.graph.children(node)
      const edges = [...ctx.graph.anyEdgesBetween(node, currentElements)]
      if (edges.length > 0) {
        ctx.addElement(node)
        const includedImplicits = [] as DeploymentElement[]
        for (const implicit of implicits) {
          const edgesWithImplicit = [...ctx.graph.anyEdgesBetween(implicit, currentElements)]
          if (edgesWithImplicit.length > 0) {
            includedImplicits.push(implicit)
            edges.push(...edgesWithImplicit)
          }
        }
        edges.push(...ctx.graph.edgesWithin(includedImplicits))
      } else {
        ctx.addImplicit(node)
        ctx.addImplicit(...implicits)
      }
      ctx.addEdges(edges)
      return
    }

    if (expr.isNested) {
      // if element.* is in currentElements,
      // it could be added as implicit - make it explicit
      if (ctx.isImplicit(node)) {
        ctx.addElement(node)
      }

      let elements = ctx.graph.children(node)
      if (elements.length > 1) {
        ctx.addEdges(ctx.graph.edgesWithin(elements))
      }
      for (const el of elements) {
        ctx.addElement(el)
        if (currentElements.length > 0) {
          ctx.addEdges(ctx.graph.anyEdgesBetween(el, currentElements))
        }
      }
      return
    }

    ctx.addElement(node)
    ctx.addEdges(ctx.graph.anyEdgesBetween(node, currentElements))
    return
  }

  const instance = ctx.graph.instance(ref.instance)
  ctx.addElement(instance)

  if (currentElements.length === 0) {
    ctx.addElement(instance.parent)
    return
  }

  ctx.addEdges(ctx.graph.anyEdgesBetween(instance, currentElements))
  if (currentElements.includes(instance.parent)) {
    return
  }
  // Check if any ancestor is already included
  const ancestor = ctx.graph.ancestors(instance).find(ancestor =>
    currentElements.includes(ancestor)
    || ctx.graph.siblings(ancestor).some(sibling => currentElements.includes(sibling))
  )
  if (ancestor) {
    ctx.addElement(ancestor)
    return
  }
}

export function excludeDeploymentRef(ctx: DeploymentViewComputeCtx, { ref, ...expr }: Expr.Ref) {
  let elements
  switch (true) {
    case 'instance' in ref:
      elements = [ctx.graph.instance(ref.instance)]
      break
    case expr.isExpanded:
      elements = [
        ctx.graph.node(ref.node),
        ...ctx.graph.children(ref.node)
      ]
      break
    case expr.isNested:
      elements = ctx.graph.children(ref.node)
      break
    default:
      elements = [ctx.graph.node(ref.node)]
      break
  }
  ctx.excludeElement(...elements)

  // const elements = [...this.resolvedElements].filter(allPass([
  //   elementExprToPredicate(expr),
  //   where
  // ]))
  // this.excludeElement(...elements)
}

export function includeWildcard(ctx: DeploymentViewComputeCtx) {
  const root = ctx.graph.rootNodes()
  const children = flatMap(root, n => ctx.graph.children(n))
  ctx.addElement(...root)
  ctx.addEdges(ctx.graph.edgesWithin(root))
  // Children implicitly
  ctx.addEdges(ctx.graph.edgesWithin(children))
}

export function excludeWildcard(ctx: DeploymentViewComputeCtx) {
  ctx.reset()
}
