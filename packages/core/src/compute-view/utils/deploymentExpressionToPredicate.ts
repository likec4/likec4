import { nonexhaustive } from '../../errors'
import { DeploymentElementExpression, type Fqn } from '../../types'
import { parentFqn } from '../../utils'

type Predicate<T> = (x: T) => boolean

export function deploymentExpressionToPredicate<T extends { id: Fqn }>(
  target: DeploymentElementExpression
): Predicate<T> {
  if (DeploymentElementExpression.isWildcard(target)) {
    return () => true
  }
  if (DeploymentElementExpression.isRef(target)) {
    const fqn = target.ref.instance ?? target.ref.node
    if (target.isExpanded) {
      return n => n.id === fqn || parentFqn(n.id) === fqn
    }
    if (target.isNested) {
      return n => n.id.startsWith(fqn + '.')
    }
    return n => n.id === fqn
  }
  nonexhaustive(target)
}
