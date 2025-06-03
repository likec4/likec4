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
export function isGroupElementKind<V extends { kind: any }>(v: V): v is V & { kind: typeof GroupElementKind } {
  return v.kind === GroupElementKind
}

/**
 * Full-qualified-name for deployment elements
 */
export type DeploymentFqn<T = string> = Tagged<T, 'DeploymentFqn'>
export type DeploymentKind<Kinds = string> = Tagged<Kinds, 'DeploymentKind'>
export type ViewId<Id = string> = Tagged<Id, 'ViewId'>

export type AnyFqn<T = string> = DeploymentFqn<T> | Fqn<T>

/**
 * @deprecated Use {@link RelationshipKind} instead
 */
export type RelationKind<Kinds = string> = RelationshipKind<Kinds>

export type RelationshipKind<Kinds = string> = Tagged<Kinds, 'RelationshipKind'>
export type RelationId<Id = string> = Tagged<Id, 'RelationId'>

export type Tag<T = string> = Tagged<T, 'Tag'>

export function AsFqn(name: string, parent?: Fqn | null): Fqn {
  return (parent ? parent + '.' + name : name) as unknown as Fqn
}

export type GlobalFqn<Id = string> = Tagged<Fqn<Id>, 'GlobalFqn'>
export function GlobalFqn<A>(projectId: ProjectId<A>, name: string): GlobalFqn<A> {
  invariant(isTruthy(projectId), 'Project ID must start with @')
  return '@' + projectId + '.' + name as any
}

export function isGlobalFqn<A extends string>(fqn: A): fqn is GlobalFqn<A> {
  return fqn.startsWith('@')
}

export function splitGlobalFqn<I extends string>(fqn: Fqn<I> | GlobalFqn<I>): [ProjectId | null, Fqn<I>] {
  if (!fqn.startsWith('@')) {
    return [null, fqn]
  }
  const firstDot = fqn.indexOf('.')
  if (firstDot < 2) {
    throw new Error('Invalid global FQN')
  }
  const projectId = fqn.slice(1, firstDot) as ProjectId<I>
  const name = fqn.slice(firstDot + 1) as Fqn<I>
  return [projectId, name]
}

export type NodeId = Tagged<string, 'NodeId' | 'Fqn' | 'DeploymentFqn'>
export function NodeId(id: string): NodeId {
  return id as any
}
export type EdgeId = Tagged<string, 'EdgeId'>

export type StepEdgeIdLiteral = `step-${number}` | `step-${number}.${number}`
export type StepEdgeId = Tagged<StepEdgeIdLiteral, 'EdgeId'>
export function stepEdgeId(step: number, parallelStep?: number): StepEdgeId {
  const id = `step-${String(step).padStart(2, '0')}` as StepEdgeId
  return parallelStep ? `${id}.${parallelStep}` as StepEdgeId : id
}
export const StepEdgeKind = '@step' as RelationshipKind<'@step'>

export function isStepEdgeId(id: string): id is StepEdgeId {
  return id.startsWith('step-')
}

export function extractStep(id: EdgeId): number {
  if (!isStepEdgeId(id)) {
    throw new Error(`Invalid step edge id: ${id}`)
  }
  return parseFloat(id.slice('step-'.length))
}
