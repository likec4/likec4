// @ts-nocheck
import { filter, flatMap, pipe, reverse } from 'remeda'
import { DeploymentElementExpression as Expr, type DeploymentRelationExpression } from '../../../types/deployments'
import { isAncestor } from '../../../utils'
import { LikeC4DeploymentGraph } from '../../LikeC4DeploymentGraph'
import { deploymentExpressionToPredicate } from '../../utils/deploymentExpressionToPredicate'

type DeploymentElement = LikeC4DeploymentGraph.Element

export const isNode = LikeC4DeploymentGraph.isNode
const isInstance = LikeC4DeploymentGraph.isInstance

export type DeploymentViewComputeCtx = any

export function includeDeploymentRef(ctx: DeploymentViewComputeCtx, { ref, ...expr }: Expr.Ref) {
  const currentElements = [...ctx.resolvedElements]
  const el = ctx.graph.element(ref.id)
  if (isNode(el)) {
    if (expr.isExpanded) {
      // const implicits = ctx.graph.allNestedInstances(node)

      // const internalEdges = pipe(
      //   ctx.graph.edgesWithin(implicits),
      //   groupBy(edge => {
      //     if ('element' in edge.source && 'element' in edge.target) {
      //       return `${edge.source.element.id}#${edge.target.element.id}`
      //     }
      //     return `${edge.source.id}#${edge.target.id}`
      //   }),
      //   //tap(console.log),
      //   entries(),
      //   flatMap(entry => {
      //     const firstEdge = pipe(
      //       entry[1] ?? [],
      //       map(edge => ({
      //         ...edge,
      //         parent: commonAncestor(edge.source.id, edge.target.id) ?? '' as Fqn
      //       })),
      //       sort((a, b) => compareFqnHierarchically(a.parent!, b.parent!)),
      //       reverse(),
      //       reduce((acc, edge) => {
      //         if (acc.length === 0) {
      //           acc.push(edge)
      //           return acc
      //         }
      //         const last = acc[acc.length - 1]!
      //         const lastDepth = last.parent.split('.').length
      //         const thisDepth = edge.parent.split('.').length
      //         if (thisDepth === lastDepth) {
      //           acc.push(edge)
      //         }
      //         return acc
      //       }, [] as Array<LikeC4DeploymentGraph.Edge & { parent: Fqn }>)
      //     )
      //     return firstEdge
      //   }),
      //   tap(console.log),
      //   filter(isTruthy)
      // )
      // ctx.addEdges(internalEdges)

      // const includedImplicits = pipe(
      //   internalEdges,
      //   flatMap(edge => [edge.source, edge.target]),
      //   unique()
      // )

      // ctx.addElement(
      //   ...pipe(
      //     includedImplicits,
      //     flatMap(instance => [instance, ...ctx.graph.ancestors(instance)]),
      //     filter(ancestor => isAncestor(node, ancestor))
      //   )
      // )

      // if (internalEdges.length > 0) {
      //   ctx.addElement(node)
      // }

      // if (currentElements.length > 0) {
      //   for (const implicit of includedImplicits) {
      //     ctx.addEdges(ctx.graph.anyEdgesBetween(implicit, currentElements))
      //   }
      //   const internalRelations = unique(internalEdges.flatMap(edge => [...edge.relations]))
      //   ctx.addEdges(
      //     pipe(
      //       ctx.graph.anyEdgesBetween(node, currentElements),
      //       map(edge => ({
      //         ...edge,
      //         relations: new Set(difference([...edge.relations], internalRelations))
      //       })),
      //       filter(edge => edge.relations.size > 0)
      //     )
      //   )
      // }
      const implicits = ctx.graph.children(el)

      const edges = [...ctx.addEdges(ctx.graph.anyEdgesBetween(el, currentElements))]

      const includedImplicits = [] as DeploymentElement[]
      for (const implicit of implicits) {
        const edgesWithImplicit = [...ctx.graph.anyEdgesBetween(implicit, currentElements)]
        if (edgesWithImplicit.length > 0) {
          ctx.addElement(implicit)
          edges.push(...ctx.addEdges(edgesWithImplicit))
          includedImplicits.push(implicit)
        } else if (isInstance(implicit)) {
          includedImplicits.push(implicit)
        }
      }
      if (includedImplicits.length > 1) {
        edges.push(...ctx.addEdges(ctx.graph.edgesWithin(includedImplicits)))
      }

      if (edges.length > 0) {
        ctx.addElement(el)
      } else {
        ctx.addImplicit(el)
      }

      ctx.addImplicit(...reverse(implicits))

      return
    }

    if (expr.isChildren) {
      // if node is in currentElements and implicit - make it explicit
      if (ctx.isImplicit(el)) {
        ctx.addElement(el)
      }
      let elements = ctx.graph.children(el)
      for (const el of elements) {
        ctx.addElement(el)
        if (currentElements.length > 0) {
          ctx.addEdges(ctx.graph.anyEdgesBetween(el, currentElements))
        }
      }
      if (elements.length > 1) {
        ctx.addEdges(ctx.graph.edgesWithin(elements))
      }

      return
    }

    ctx.addElement(el)
    ctx.addEdges(ctx.graph.anyEdgesBetween(el, currentElements))
    return
  }

  ctx.addElement(el)
  ctx.addEdges(ctx.graph.anyEdgesBetween(el, currentElements))

  if (el.isOnlyChild) {
    return
  }
  // Check if any ancestor is already included
  const ancestor = ctx.graph.ancestors(el).find(ancestor =>
    currentElements.includes(ancestor)
    || ctx.graph.siblings(ancestor).some(sibling =>
      currentElements.some(current => current === sibling || isNode(current) && isAncestor(sibling, current))
    )
  )
  if (ancestor && !currentElements.includes(ancestor)) {
    ctx.addElement(ancestor)
    return
  }
}

export function excludeDeploymentRef(ctx: DeploymentViewComputeCtx, expr: Expr.Ref) {
  ctx.excludeElement(
    ...resolveElements(ctx, expr)
  )
}

export function includeWildcard(ctx: DeploymentViewComputeCtx) {
  const root = ctx.graph.rootNodes().map(node => {
    const [child, ...rest] = ctx.graph.children(node)
    // If there is only one child and it is a Instance, return it
    return !!child && rest.length === 0 && isInstance(child) ? child : node
  })
  ctx.addElement(...root)
  const children = flatMap(root, n => [n, ...ctx.graph.children(n)])
  ctx.addImplicit(...children)
  if (children.length > 1) {
    ctx.addEdges(ctx.graph.edgesWithin(children))
  }
}

export function excludeWildcard(ctx: DeploymentViewComputeCtx) {
  ctx.reset()
}

function resolveElements(ctx: DeploymentViewComputeCtx, expr: Expr) {
  if (Expr.isWildcard(expr)) {
    return ctx.graph.rootNodes()
  }
  const el = ctx.graph.element(expr.ref.id)
  if (isNode(el)) {
    if (expr.isChildren) {
      const children = ctx.graph.children(el)
      return children.length > 0 ? children : [el]
    }
    if (expr.isExpanded) {
      return [...ctx.graph.children(el), el]
    }
    return [el]
  }

  return [el]
}

export function includeDirectRelation(ctx: DeploymentViewComputeCtx, expr: DeploymentRelationExpression.Direct) {
  const sources = resolveElements(ctx, expr.source)
  const targets = resolveElements(ctx, expr.target)
  if (sources.length === 0 || targets.length === 0) {
    return
  }

  const edges = [] as LikeC4DeploymentGraph.Edge[]
  for (const source of sources) {
    let newedges = ctx.graph.anyEdgesBetween(source, targets)
    if (newedges.length === 0) {
      continue
    }
    if (expr.isBidirectional !== true) {
      newedges = newedges.filter(edge => edge.source.id === source.id)
    }
    edges.push(...newedges)
  }

  ctx.addEdges(edges)
}

export function excludeDirectRelation(ctx: DeploymentViewComputeCtx, expr: DeploymentRelationExpression.Direct) {
  const isSource = deploymentExpressionToPredicate(expr.source)
  const isTarget = deploymentExpressionToPredicate(expr.target)
  const edges = pipe(
    ctx.edges,
    filter(edge =>
      (isSource(edge.source) && isTarget(edge.target))
      || (expr.isBidirectional === true && isSource(edge.target) && isTarget(edge.source))
    )
    // map(edge => [edge.source, edge.target] as const)
  )
  ctx.removeEdges(edges)
}
