import { nonexhaustive } from '../../errors'
import { DeploymentElementExpression, type Fqn } from '../../types'

type Predicate<T> = (x: T) => boolean

export function deploymentExpressionToPredicate<T extends { id: string }>(
  target: DeploymentElementExpression
): Predicate<T> {
  if (DeploymentElementExpression.isWildcard(target)) {
    return () => true
  }
  if (DeploymentElementExpression.isRef(target)) {
    const fqn = target.ref.id
    if (target.isExpanded) {
      return n => n.id === fqn || n.id.startsWith(fqn + '.')
    }
    if (target.isChildren) {
      return n => n.id.startsWith(fqn + '.')
    }
    return n => n.id === fqn
  }
  nonexhaustive(target)
}
