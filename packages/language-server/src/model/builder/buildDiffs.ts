import type * as c4 from '@likec4/core'
import { isGlobalFqn } from '@likec4/core'
import { mergeElementOverlay } from '@likec4/core/compute-view'
import { FqnRef } from '@likec4/core/types'
import { parentFqn, sortParentsFirst } from '@likec4/core/utils'
import { groupBy, isNonNullish, isTruthy, mapValues, prop, unique, values } from 'remeda'
import type { Writable } from 'type-fest'
import type {
  ParsedAstDiff,
  ParsedAstDynamicView,
  ParsedAstElement,
  ParsedAstExtend,
  ParsedAstRelation,
  ParsedLikeC4LangiumDocument,
} from '../../ast'
import { logger } from '../../logger'
import { relationFingerprint } from '../relationFingerprint'

export interface BuildDiffsParams {
  docs: ReadonlyArray<ParsedLikeC4LangiumDocument>
  toModelElement: (el: ParsedAstElement) => c4.Element | null
  toModelRelation: (rel: ParsedAstRelation) => c4.Relationship | null
  /**
   * Elements of the model before any diff is applied
   */
  elements: Readonly<Record<string, c4.Element>>
  /**
   * Relations of the model before any diff is applied
   */
  relations: Readonly<Record<string, c4.Relationship>>
  /**
   * View ids that already exist in the model. A diff cannot introduce those ids.
   */
  existingViewIds: ReadonlySet<string>
  toModelView: (view: ParsedAstDynamicView, docUri: string) => c4.ParsedDynamicView | null
}

function mergeOverlay(
  target: Writable<c4.ModelDiffElementOverlay>,
  ext: ParsedAstExtend,
): Writable<c4.ModelDiffElementOverlay> {
  if (ext.tags) {
    target.tags = unique([...(target.tags ?? []), ...ext.tags])
  }
  if (ext.links) {
    target.links = [...(target.links ?? []), ...ext.links]
  }
  if (ext.metadata) {
    target.metadata = { ...target.metadata, ...ext.metadata }
  }
  return target
}

/**
 * Builds model diffs from parsed documents.
 * Diffs with the same name in different documents are merged.
 *
 * Invalid entries are skipped (validation reports them):
 * - removed elements or relations that do not exist in the model
 * - added elements whose parent does not exist
 * - added relations with an endpoint that does not exist
 */
export function buildDiffs({
  docs,
  toModelElement,
  toModelRelation,
  elements,
  relations,
  existingViewIds,
  toModelView,
}: BuildDiffsParams): Record<c4.DiffId, c4.ModelDiff> | undefined {
  const parsedDiffs = docs.flatMap(doc => doc.c4Diffs)
  if (parsedDiffs.length === 0) {
    return undefined
  }
  const relationsByFingerprint = groupBy(values(relations), relationFingerprint)

  const buildDiff = (parts: ReadonlyArray<ParsedAstDiff>, id: c4.DiffId): c4.ModelDiff => {
    const added: Record<string, c4.Element> = {}
    const all = sortParentsFirst(parts.flatMap(p => p.elements).map(toModelElement).filter(isTruthy))
    for (const element of all) {
      const parent = parentFqn(element.id)
      if (parent && !(parent in elements) && !(parent in added)) {
        logger.debug`Diff ${id}: no parent found for ${element.id}`
        continue
      }
      added[element.id] = element
    }

    const modify: Record<string, Writable<c4.ModelDiffElementOverlay>> = {}
    for (const ext of parts.flatMap(p => p.extendElements)) {
      const addedElement = added[ext.id]
      if (addedElement) {
        added[ext.id] = mergeElementOverlay(addedElement, mergeOverlay({}, ext))
      } else if (ext.id in elements) {
        mergeOverlay(modify[ext.id] ??= {}, ext)
      }
    }

    const exists = (ref: c4.FqnRef.ModelRef) => {
      const fqn = FqnRef.flatten(ref)
      return isGlobalFqn(fqn) || fqn in elements || fqn in added
    }
    const addedRelations: Record<string, c4.Relationship> = {}
    for (const relation of parts.flatMap(p => p.relations).map(toModelRelation).filter(isTruthy)) {
      if (exists(relation.source) && exists(relation.target)) {
        addedRelations[relation.id] = relation
      } else {
        logger.debug`Diff ${id}: invalid relation ${relation.id}`
      }
    }

    const views: Record<string, c4.ParsedDynamicView> = {}
    for (const part of parts) {
      for (const view of part.views) {
        const modelView = toModelView(view, part.docUri)
        if (!modelView || existingViewIds.has(modelView.id) || modelView.id in views) {
          continue
        }
        views[modelView.id] = modelView
      }
    }

    return {
      id,
      title: parts.map(p => p.title).find(isNonNullish) ?? null,
      description: parts.map(p => p.description).find(isNonNullish) ?? null,
      remove: {
        elements: unique(parts.flatMap(p => p.removeElements).map(prop('fqn')).filter(fqn => fqn in elements)),
        relations: unique(
          parts
            .flatMap(p => p.removeRelations)
            .flatMap(({ fingerprint }) => relationsByFingerprint[fingerprint] ?? [])
            .map(prop('id')),
        ),
      },
      add: {
        elements: added,
        relations: addedRelations,
      },
      modify: {
        elements: modify,
      },
      views,
    }
  }

  return mapValues(groupBy(parsedDiffs, prop('id')), buildDiff)
}
