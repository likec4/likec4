import { isTruthy } from 'remeda'
import type { Tagged, TupleToUnion } from 'type-fest'
import { invariant } from '../errors'

export type ProjectId = Tagged<string, 'ProjectID'>

export type IconUrl = Tagged<string, 'IconUrl'> | 'none'

// Full-qualified-name
export type Fqn<Id extends string = string> = Tagged<Id, 'Fqn'>

export type Tag<Tags extends string = string> = Tagged<Tags, 'Tag'>

export function AsFqn(name: string, parent?: Fqn | null): Fqn {
  return (parent ? parent + '.' + name : name) as Fqn
}

export type GlobalFqn<Id extends string = string> = Tagged<Fqn<Id>, 'GlobalFqn'>
export function GlobalFqn(projectId: ProjectId, name: string): GlobalFqn {
  invariant(isTruthy(projectId), 'Project ID must start with @')
  return '@' + projectId + '.' + name as GlobalFqn
}

export function isGlobalFqn(fqn: string): fqn is GlobalFqn {
  return fqn.startsWith('@')
}

export function splitGlobalFqn<Id extends string>(fqn: Fqn<Id> | GlobalFqn<Id>): [ProjectId | null, Fqn<Id>] {
  if (!fqn.startsWith('@')) {
    return [null, fqn]
  }
  const firstDot = fqn.indexOf('.')
  if (firstDot < 2) {
    throw new Error('Invalid global FQN')
  }
  const projectId = fqn.slice(1, firstDot) as ProjectId
  const name = fqn.slice(firstDot + 1) as Fqn<Id>
  return [projectId, name]
}
