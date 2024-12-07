import { findConnectionsWithin } from '../../../model/connection/deployment'
import type { DeploymentElementExpression } from '../../../types/deployments'
import type { Elem, PredicateExecutor } from '../_types'
import { MutableMemory } from '../Memory'

export const WildcardPredicate: PredicateExecutor<DeploymentElementExpression.Wildcard> = {
  include: (_, { model, stage }) => {
    const children = [] as Elem[]

    const rootElements = [...model.roots()].map(root => {
      const [child, ...rest] = [...root.children()]
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
    })

    stage.addExplicit(rootElements)
    if (rootElements.length > 1) {
      stage.addConnections(findConnectionsWithin(rootElements))
    }

    if (children.length > 1) {
      stage.addConnections(findConnectionsWithin(children))
    }
    return stage.patch()
  },
  exclude: () => {
    return () => MutableMemory.empty()
  }
}
