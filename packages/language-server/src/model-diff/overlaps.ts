import type { DiffId } from '@likec4/core'
import { FqnRef } from '@likec4/core/types'
import { ancestorsFqn, parentFqn } from '@likec4/core/utils'
import { groupBy, isDeepEqual, isNonNullish, prop, unique, values } from 'remeda'
import type { ParsedAstDiff, ParsedAstRelation, ParsedLikeC4LangiumDocument } from '../ast'
import { relationFingerprint } from '../model/relationFingerprint'

/**
 * Two diffs that change the same part of the model.
 * Overlaps are never resolved automatically: the owners of the diffs decide.
 */
export interface DiffOverlap {
  diffs: [DiffId, DiffId]
  /**
   * What overlaps, for example `both remove cloud.db`
   */
  message: string
}

interface Footprint {
  id: DiffId
  removes: string[]
  removedRelations: Set<string>
  adds: Set<string>
  addedRelations: Map<string, string>
  /**
   * Elements the diff extends, relates to, or adds children to
   */
  uses: Set<string>
  metadata: Map<string, Record<string, unknown>>
}

function relationLabel(relation: Pick<ParsedAstRelation, 'source' | 'target' | 'title'>): string {
  const title = relation.title ? ` '${relation.title}'` : ''
  return `${FqnRef.flatten(relation.source)} -> ${FqnRef.flatten(relation.target)}${title}`
}

function footprintOf(parts: [ParsedAstDiff, ...ParsedAstDiff[]]): Footprint {
  const elements = parts.flatMap(p => p.elements)
  const relations = parts.flatMap(p => p.relations)
  const extendsOf = parts.flatMap(p => p.extendElements)
  const metadata = new Map<string, Record<string, unknown>>()
  for (const ext of extendsOf) {
    if (ext.metadata) {
      metadata.set(ext.id, { ...metadata.get(ext.id), ...ext.metadata })
    }
  }
  return {
    id: parts[0].id,
    removes: parts.flatMap(p => p.removeElements.map(prop('fqn'))),
    removedRelations: new Set(parts.flatMap(p => p.removeRelations.map(prop('fingerprint')))),
    adds: new Set(elements.map(prop('id'))),
    addedRelations: new Map(relations.map(r => [relationFingerprint(r), relationLabel(r)])),
    uses: new Set([
      ...extendsOf.map(prop('id')),
      ...relations.flatMap(r => [FqnRef.flatten(r.source), FqnRef.flatten(r.target)]),
      ...elements.map(e => parentFqn(e.id)).filter(isNonNullish),
    ]),
    metadata,
  }
}

/**
 * The element, or its ancestor, that the diff removes
 */
function removedBy(fqn: string, removes: ReadonlyArray<string>): string | undefined {
  return [fqn, ...ancestorsFqn(fqn)].find(x => removes.includes(x))
}

function bothChange(a: Footprint, b: Footprint, relationLabels: ReadonlyMap<string, string>): string[] {
  return [
    ...b.removes.filter(x => removedBy(x, a.removes)).map(x => `both remove ${x}`),
    ...a.removes.filter(x => !b.removes.includes(x) && removedBy(x, b.removes)).map(x => `both remove ${x}`),
    ...[...a.removedRelations]
      .filter(f => b.removedRelations.has(f))
      .map(f => `both remove ${relationLabels.get(f) ?? 'the same relationship'}`),
    ...[...a.adds].filter(x => b.adds.has(x)).map(x => `both add ${x}`),
    ...[...a.addedRelations].filter(([f]) => b.addedRelations.has(f)).map(([, label]) => `both add ${label}`),
    ...[...a.metadata].flatMap(([fqn, metadata]) => {
      const other = b.metadata.get(fqn) ?? {}
      return Object.keys(metadata)
        .filter(key => key in other && !isDeepEqual(metadata[key], other[key]))
        .map(key => `both set metadata '${key}' of ${fqn}`)
    }),
  ]
}

function affects(a: Footprint, b: Footprint, base: ReadonlySet<string>): string[] {
  return [...b.uses].filter(x => !b.adds.has(x)).flatMap(x => {
    const removed = removedBy(x, a.removes)
    switch (true) {
      case !!removed:
        return [`${a.id} removes ${removed}, ${b.id} uses ${removed === x ? 'it' : x}`]
      case !base.has(x) && a.adds.has(x):
        return [`${b.id} uses ${x}, which only ${a.id} adds`]
      default:
        return []
    }
  })
}

/**
 * Finds diffs that change the same elements or relationships, or depend on each other.
 */
export function findDiffOverlaps(docs: ReadonlyArray<ParsedLikeC4LangiumDocument>): DiffOverlap[] {
  const base = new Set(docs.flatMap(d => d.c4Elements.map(prop('id'))))
  const relationLabels = new Map(docs.flatMap(d => d.c4Relations.map(r => [relationFingerprint(r), relationLabel(r)])))
  const footprints = values(groupBy(docs.flatMap(d => d.c4Diffs), prop('id'))).map(footprintOf)
  return footprints.flatMap((a, index) =>
    footprints.slice(index + 1).flatMap(b =>
      unique([...bothChange(a, b, relationLabels), ...affects(a, b, base), ...affects(b, a, base)])
        .map(message => ({ diffs: [a.id, b.id] satisfies [DiffId, DiffId], message }))
    )
  )
}

/**
 * Overlaps of the diff with other diffs, as `<other diff>: <what overlaps>`
 */
export function overlapsOf(overlaps: ReadonlyArray<DiffOverlap>, diffId: DiffId): string[] {
  return overlaps.flatMap(({ diffs: [a, b], message }) =>
    a === diffId ? [`${b}: ${message}`] : b === diffId ? [`${a}: ${message}`] : []
  )
}
