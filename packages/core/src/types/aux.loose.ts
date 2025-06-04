import type { Coalesce } from './_common'
import type { Any } from './aux'

/**
 * @see {@link LiteralUnion} from type-fest (https://github.com/sindresorhus/type-fest/blob/main/source/literal-union.d.ts)
 */
type StringPrimitive = string & Record<never, never>

export type ElementId<A extends Any> = Coalesce<A['ElementId']> | StringPrimitive
export type DeploymentId<A extends Any> = Coalesce<A['DeploymentId']> | StringPrimitive
export type ViewId<A extends Any> = Coalesce<A['ViewId']> | StringPrimitive
export type Tag<A extends Any> = Coalesce<A['Tag']> | StringPrimitive
export type Tags<A extends Any> = Array<Coalesce<A['Tag']> | StringPrimitive>

export type ElementKind<A extends Any> = Coalesce<A['ElementKind']> | StringPrimitive
export type DeploymentKind<A extends Any> = Coalesce<A['DeploymentKind']> | StringPrimitive
export type RelationKind<A extends Any> = Coalesce<A['RelationKind']> | StringPrimitive
