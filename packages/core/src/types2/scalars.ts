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
export type Fqn<Id = string> = Tagged<Id, 'Fqn'>
export type ElementKind<Kinds = string> = Tagged<Kinds, 'ElementKind'>
export const GroupElementKind = '@group' as ElementKind<'@group'>

/**
 * Full-qualified-name for deployment elements
 */
export type DeploymentFqn<T = string> = Tagged<T, 'DeploymentFqn'>
export type DeploymentKind<Kinds = string> = Tagged<Kinds, 'DeploymentKind'>
export type ViewId<Id = string> = Tagged<Id, 'ViewId'>

export type RelationKind<Kinds = string> = Tagged<Kinds, 'RelationKind'>
export type RelationId<Id = string> = Tagged<Id, 'RelationId'>

export type Tag<T = string> = Tagged<T, 'Tag'>

export function AsFqn(name: string, parent?: Fqn | null): Fqn {
  return (parent ? parent + '.' + name : name) as unknown as Fqn
}

export type GlobalFqn<Id = string> = Tagged<Fqn<Id>, 'GlobalFqn'>
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
