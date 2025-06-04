import type { Coalesce } from './_common'
import type { Any } from './aux'

/**
 * @see {@link LiteralUnion} from type-fest (https://github.com/sindresorhus/type-fest/blob/main/source/literal-union.d.ts)
 */
export type OrString = string & Record<never, never>

export type ElementId<A extends Any> = Coalesce<A['ElementId']> | OrString
export type DeploymentId<A extends Any> = Coalesce<A['DeploymentId']> | OrString
export type ViewId<A extends Any> = Coalesce<A['ViewId']> | OrString
export type Tag<A extends Any> = Coalesce<A['Tag']> | OrString
export type Tags<A extends Any> = readonly (Coalesce<A['Tag']> | OrString)[]

export type ElementKind<A extends Any> = Coalesce<A['ElementKind']> | OrString
export type DeploymentKind<A extends Any> = Coalesce<A['DeploymentKind']> | OrString
export type RelationKind<A extends Any> = Coalesce<A['RelationKind']> | OrString
