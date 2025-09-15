import { isTruthy } from 'remeda'
import type * as aux from './_aux'
import type { AnyAux, Unknown } from './_aux'
import type { FqnRef } from './fqnRef'
import type { AbstractRelationship, ElementStyle } from './model-logical'
import type { Icon } from './scalar'
import type { Color, ElementShape } from './styles'

export interface DeploymentElementStyle extends ElementStyle {
  readonly icon?: Icon
  readonly shape?: ElementShape
  readonly color?: Color
}

// dprint-ignore
export interface DeploymentNode<A extends AnyAux = Unknown>
  extends
    aux.WithDescriptionAndTech,
    aux.WithOptionalTags<A>,
    aux.WithOptionalLinks,
    aux.WithMetadata<A>,
    aux.WithNotation
{
  element?: never
  // Full-qualified-name for Deployment model
  readonly id: aux.StrictDeploymentFqn<A>
  readonly kind: aux.DeploymentKind<A>
  readonly title: string
  readonly style: DeploymentElementStyle
}

// dprint-ignore
export interface DeployedInstance<A extends AnyAux = Unknown>
  extends
    aux.WithDescriptionAndTech,
    aux.WithOptionalTags<A>,
    aux.WithOptionalLinks,
    aux.WithMetadata<A>,
    aux.WithNotation
{
  kind?: never
  /**
   * Format: `<DeploymentNode Fqn>.<Instance Id>`
   * i.e parent fqn is deployment target
   */
  readonly id: aux.StrictDeploymentFqn<A>
  readonly element: aux.StrictFqn<A>
  readonly title?: string
  readonly style?: DeploymentElementStyle
}

export type DeploymentElement<A extends AnyAux = Unknown> = DeploymentNode<A> | DeployedInstance<A>

export type DeploymentElementRef<A extends AnyAux = Unknown> = {
  readonly id: aux.StrictDeploymentFqn<A>
  readonly element?: aux.StrictFqn<A>
}

export function isDeploymentNode<A extends AnyAux>(el: DeploymentElement<A>): el is DeploymentNode<A> {
  return isTruthy(el.kind) && !isTruthy(el.element)
}

export function isDeployedInstance<A extends AnyAux>(el: DeploymentElement<A>): el is DeployedInstance<A> {
  return isTruthy(el.element) && !isTruthy(el.kind)
}

/**
 * Relationship in deployment model
 */
export interface DeploymentRelationship<A extends AnyAux = Unknown> extends AbstractRelationship<A> {
  readonly source: FqnRef.DeploymentRef<A>
  readonly target: FqnRef.DeploymentRef<A>
}
/**
 * Backward compatibility alias
 * @deprecated Use {@link DeploymentRelationship} instead
 */
export type DeploymentRelation<A extends AnyAux = Unknown> = DeploymentRelationship<A>
