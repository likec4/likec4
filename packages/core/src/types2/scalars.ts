import { isTruthy } from 'remeda'
import type { Tagged } from 'type-fest'
import { invariant } from '../errors'

export type ProjectId<T = string> = Tagged<T, 'ProjectID'>

export type BuiltInIcon = 'none' | `${'aws' | 'azure' | 'gcp' | 'tech'}:${string}`
export type Icon = Tagged<string, 'Icon'> | BuiltInIcon
export type IconUrl = Icon

/**
 * Full-qualified-name for model elements
 *
 * @param This - Fqn of the element (specific element)
 * @param All - The type of all known FQNs
 *
 * @example
 * ```ts
 * type ElementAFqn = Fqn<'a', 'a' | ' | 'b'>
 *
 * ```
 */
export type Fqn<This = string, All = This> = Tagged<This, 'Fqn', All>
export type ElementKind<This = string, All = string> = Tagged<This, 'ElementKind', All>
export const GroupElementKind = '@group' as ElementKind<'@group'>

/**
 * Full-qualified-name for deployment elements
 */
export type DeploymentFqn<T = string> = Tagged<string, 'DeploymentFqn', T>
export type DeploymentKind<T = string> = Tagged<string, 'DeploymentKind', T>
export type ViewId<Id = string> = Tagged<string, 'ViewId', Id>

export type RelationKind<T = string> = Tagged<string, 'RelationKind', T>
export type RelationId<Id = string> = Tagged<Id, 'RelationId'>

export type Tag<Id = string> = Tagged<string, 'Tag', Id>

export function AsFqn(name: string, parent?: Fqn | null): Fqn {
  return (parent ? parent + '.' + name : name) as unknown as Fqn
}

export type GlobalFqn<This = string, All = This> = Tagged<Fqn<This, All>, 'GlobalFqn', All>
export function GlobalFqn(projectId: ProjectId, name: string): GlobalFqn {
  invariant(isTruthy(projectId), 'Project ID must start with @')
  return '@' + projectId + '.' + name as GlobalFqn
}

export function isGlobalFqn(fqn: string): fqn is GlobalFqn {
  return fqn.startsWith('@')
}

export function splitGlobalFqn(fqn: Fqn | GlobalFqn): [ProjectId | null, Fqn] {
  if (!fqn.startsWith('@')) {
    return [null, fqn]
  }
  const firstDot = fqn.indexOf('.')
  if (firstDot < 2) {
    throw new Error('Invalid global FQN')
  }
  const projectId = fqn.slice(1, firstDot) as ProjectId
  const name = fqn.slice(firstDot + 1) as Fqn
  return [projectId, name]
}
