import { isString, isTruthy } from 'remeda'
import type { Tagged } from 'type-fest'
import { invariant } from '../utils'

export type ProjectId<T = string> = Tagged<T, 'ProjectID'>
export function ProjectId(name: string): ProjectId {
  return name as unknown as ProjectId
}

export type MarkdownOrString = { txt: string; md?: never } | { md: string; txt?: never }

/**
 * Converts a MarkdownOrString object or a plain string into a simple string representation.
 * This utility function handles different types of text content and normalizes them to a string format.
 *
 * @param value - The content to be flattened.
 *   Can be one of:
 *   - A plain string
 *   - A MarkdownOrString object with either txt or md property
 *   - undefined or null
 *
 * @returns The string content contained within the input value.
 *   - Returns the input directly if it's already a string
 *   - Returns the txt property if available in a MarkdownOrString object
 *   - Falls back to the md property if txt is not available
 *   - Returns null if:
 *     - The input is null or undefined
 *     - The resulting string value is empty, whitespace, or null
 *
 * @example
 * // String input
 * flattenMarkdownOrString("Hello world") // Returns: "Hello world"
 * flattenMarkdownOrString("   ") // Returns: null
 *
 * // MarkdownOrString with txt property
 * flattenMarkdownOrString({ txt: "Plain text" }) // Returns: "Plain text"
 * flattenMarkdownOrString({ txt: "   " }) // Returns: null
 *
 * // MarkdownOrString with md property
 * flattenMarkdownOrString({ md: "**Bold markdown**" }) // Returns: "**Bold markdown**"
 *
 * // Null input
 * flattenMarkdownOrString(null) // Returns: null
 */
export function flattenMarkdownOrString(value: MarkdownOrString | string): string
export function flattenMarkdownOrString(value: MarkdownOrString | string | undefined | null): string | null
export function flattenMarkdownOrString(value: MarkdownOrString | string | undefined | null): string | null {
  if (value === null || value === undefined) {
    return null
  }
  const content = isString(value) ? value : value.txt ?? value.md
  return isTruthy(content?.trim()) ? content : null
}

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
export function Fqn(name: string, parent?: Fqn | null): Fqn {
  return (parent ? parent + '.' + name : name) as unknown as Fqn
}

export type ElementKind<Kinds = string> = Tagged<Kinds, 'ElementKind'>
export const GroupElementKind = '@group' as ElementKind<'@group'>
export type GroupElementKind = typeof GroupElementKind

export function isGroupElementKind<V extends { kind?: any }>(v: V): v is V & { kind: GroupElementKind } {
  return v.kind === GroupElementKind
}

/**
 * Full-qualified-name for deployment elements
 */
export type DeploymentFqn<T = string> = Tagged<T, 'DeploymentFqn'>
export function DeploymentFqn(name: string, parent?: DeploymentFqn | null): DeploymentFqn {
  return (parent ? parent + '.' + name : name) as unknown as DeploymentFqn
}

export type DeploymentKind<Kinds = string> = Tagged<Kinds, 'DeploymentKind'>
export type ViewId<Id = string> = Tagged<Id, 'ViewId'>
export function ViewId(id: string): ViewId {
  return id as any
}

export type AnyFqn<T = string> = DeploymentFqn<T> | Fqn<T>

/**
 * @deprecated Use {@link RelationshipKind} instead
 */
export type RelationKind<Kinds = string> = RelationshipKind<Kinds>

export type RelationshipKind<Kinds = string> = Tagged<Kinds, 'RelationshipKind'>
export type RelationId<Id = string> = Tagged<Id, 'RelationId'>
export function RelationId(id: string): RelationId {
  return id as any
}

export type Tag<T = string> = Tagged<T, 'Tag'>

export type GlobalFqn<Id = string> = Tagged<Fqn<Id>, 'GlobalFqn'>
export function GlobalFqn<A>(projectId: A | ProjectId<A>, name: string): GlobalFqn<A> {
  invariant(typeof projectId === 'string' && projectId != '')
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
export function EdgeId(id: string): EdgeId {
  return id as any
}

export type StepEdgeIdLiteral = `step-${number}` | `step-${number}.${number}`
export type StepEdgeId = Tagged<StepEdgeIdLiteral, 'EdgeId'>
export function stepEdgeId(step: number, parallelStep?: number): StepEdgeId {
  const id = `step-${String(step).padStart(2, '0')}` as StepEdgeId
  return parallelStep ? `${id}.${parallelStep}` as StepEdgeId : id
}
export const StepEdgeKind = '@step'

export function isStepEdgeId(id: string): id is StepEdgeId {
  return id.startsWith('step-')
}

export function extractStep(id: EdgeId): number {
  if (!isStepEdgeId(id)) {
    throw new Error(`Invalid step edge id: ${id}`)
  }
  return parseFloat(id.slice('step-'.length))
}
