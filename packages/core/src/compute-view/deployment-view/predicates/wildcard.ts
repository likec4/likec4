import { findConnectionsWithin } from '../../../model/connection/deployment'
import type { DeploymentElementExpression } from '../../../types/deployments'
import type { Elem, PredicateExecutor } from '../_types'
import { MutableMemory } from '../Memory'

export const WildcardPredicate: PredicateExecutor<DeploymentElementExpression.Wildcard> = {
  include: (_, { model, stage }) => {
    const children = [] as Elem[]

    const rootElements = [...model.roots()].map(root => {
      const onlyOneInstance = root.onlyOneInstance()
      if (onlyOneInstance) {
        children.push(onlyOneInstance)
        return onlyOneInstance
      }
      children.push(...root.children())
      return root
    })

    stage.addExplicit(rootElements)
    if (children.length > 1) {
      stage.addConnections(findConnectionsWithin(children))
    }
    return stage.patch()
  },
  exclude: () => {
    return () => MutableMemory.empty()
  }
}
