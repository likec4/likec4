import { findConnectionsWithin } from '../../../model/connection/deployment'
import type { DeploymentElementExpression } from '../../../types/deployments'
import type { Elem, PredicateParams } from '../_types'
import { MutableMemory, type Patch } from '../Memory'

export function includeWildcard({
  model,
  stage
}: PredicateParams<DeploymentElementExpression.Wildcard>): Patch {
  // We show all roots and their children

  const children = [] as Elem[]

  const rootElements = model.roots().map(root => {
    const [child, ...rest] = root.children().toArray()
    if (!child) {
      children.push(root)
      return root
    }
    // If there is only one child and it is a Instance, return it
    if (child.isInstance() && rest.length === 0) {
      children.push(child)
      return child
    }
    children.push(child, ...rest)

    return root
  }).toArray()

  stage.addExplicit(rootElements)

  if (children.length > 1) {
    stage.addConnections(findConnectionsWithin(children)).forEach(c => {
      stage.addImplicit([c.source, c.target])
    })
  }

  // const children = flatMap(rootElements, n => [n, ...ctx.graph.children(n)])

  // const root = ctx.graph.rootNodes().map(node => {
  //   const [child, ...rest] = ctx.gr  aph.children(node)
  //   // If there is only one child and it is a Instance, return it
  //   return !!child && rest.length === 0 && isInstance(child) ? child : node
  // })
  // ctx.addElement(...root)
  // const children = flatMap(root, n => [n, ...ctx.graph.children(n)])
  // ctx.addImplicit(...children)
  // if (children.length > 1) {
  //   ctx.addEdges(ctx.graph.edgesWithin(children))
  // }
  return stage.patch()
}

export function excludeWildcard(_params: PredicateParams): Patch {
  return () => new MutableMemory()
}
