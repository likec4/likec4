import { nonexhaustive } from '../../errors'
import { DeploymentExpression, type Fqn } from '../../types'
import { parentFqn } from '../../utils'

type Predicate<T> = (x: T) => boolean

export function deploymentExpressionToPredicate<T extends { id: Fqn }>(
  target: DeploymentExpression
): Predicate<T> {
  if (DeploymentExpression.isWildcard(target)) {
    return () => true
  }
  if (DeploymentExpression.isRef(target)) {
    const fqn = target.ref.node ?? target.ref.instance
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
