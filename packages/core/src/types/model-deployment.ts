import type { MergeExclusive, Simplify } from 'type-fest'
import type { Link } from './_common'
import type { AnyAux, Aux, UnknownAux } from './aux'
import type { FqnRef } from './fqnRef'
import type { AbstractRelationship, ElementStyle } from './model-logical'
import type { Icon } from './scalars'
import type {
  ElementShape,
  ThemeColor,
} from './styles'

export interface DeploymentElementStyle extends ElementStyle {
  readonly icon?: Icon
  readonly shape?: ElementShape
  readonly color?: ThemeColor
}

export interface DeploymentNode<A extends AnyAux = UnknownAux> {
  // Full-qualified-name for Deployment model
  readonly id: Aux.Strict.DeploymentFqn<A>
  readonly kind: Aux.DeploymentKind<A>
  readonly title: string
  readonly description?: string | null
  readonly technology?: string | null
  readonly tags?: Aux.Tags<A> | null
  readonly links?: readonly Link[] | null
  readonly style: DeploymentElementStyle
  readonly notation?: string
  readonly metadata?: Aux.Metadata<A>
}

export interface DeployedInstance<A extends AnyAux = UnknownAux> {
  /**
   * Format: `<DeploymentNode Fqn>.<Instance Id>`
   * i.e parent fqn is deployment target
   */
  readonly id: Aux.Strict.DeploymentFqn<A>
  readonly element: Aux.Strict.Fqn<A>
  readonly title: string
  readonly description?: string | null
  readonly technology?: string | null
  readonly tags?: Aux.Tags<A> | null
  readonly links?: readonly Link[] | null
  readonly style?: DeploymentElementStyle
  readonly notation?: string
  readonly metadata?: Aux.Metadata<A>
}

export type DeploymentElement<A extends AnyAux = UnknownAux> = Simplify<
  MergeExclusive<DeploymentNode<A>, DeployedInstance<A>>
>

export type DeploymentElementRef<A extends AnyAux = UnknownAux> = {
  readonly id: Aux.Strict.DeploymentFqn<A>
  readonly element?: Aux.Strict.Fqn<A>
}

export function isDeploymentNode<A extends AnyAux>(el: DeploymentElement<A>): el is DeploymentNode<A> {
  return 'kind' in el && !('element' in el)
}

export function isDeployedInstance<A extends AnyAux>(el: DeploymentElement<A>): el is DeployedInstance<A> {
  return 'element' in el && !('kind' in el)
}

/**
 * Relationship in deployment model
 */
export interface DeploymentRelationship<A extends AnyAux = UnknownAux> extends AbstractRelationship<A> {
  readonly source: FqnRef.DeploymentRef<A>
  readonly target: FqnRef.DeploymentRef<A>
}
/**
 * Backward compatibility alias
 * @deprecated Use {@link DeploymentRelationship} instead
 */
export type DeploymentRelation<A extends AnyAux = UnknownAux> = DeploymentRelationship<A>
