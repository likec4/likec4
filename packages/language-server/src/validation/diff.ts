import { type ProjectId, FqnRef } from '@likec4/core'
import { type ValidationCheck, AstUtils, DocumentState, WorkspaceCache } from 'langium'
import { ast } from '../ast'
import { relationFingerprint } from '../model/relationFingerprint'
import type { LikeC4Services } from '../module'
import { projectIdFrom, safeCall } from '../utils'
import { tryOrLog } from './_shared'

export const modelDiffChecks = (_services: LikeC4Services): ValidationCheck<ast.ModelDiff> => {
  return tryOrLog((diff, accept) => {
    if (diff.removes.length === 0 && diff.adds.length === 0) {
      accept('warning', 'Diff has no changes', {
        node: diff,
        property: 'name',
      })
    }
    for (const node of diff.adds.flatMap(add => add.elements).filter(ast.isExtendRelation)) {
      accept('error', 'Diff cannot extend relations. Remove the relation and add a new one instead', { node })
    }
  })
}

export const diffRemoveEntryChecks = (services: LikeC4Services): ValidationCheck<ast.DiffRemoveEntry> => {
  const modelParser = services.likec4.ModelParser

  // Relations of the model before any diff is applied (relations added by diffs are not in c4Relations)
  const cache = new WorkspaceCache<ProjectId, Set<string>>(services.shared, DocumentState.Linked)
  function getProjectFingerprints(projectId: ProjectId): Set<string> {
    return cache.get(projectId, () =>
      new Set(
        services.shared.workspace.LangiumDocuments.projectDocuments(projectId)
          .flatMap(doc => doc.c4Relations ?? [])
          .map(relationFingerprint),
      ))
  }

  return tryOrLog((entry, accept) => {
    if (!entry.target) {
      // Unresolved references are reported by the linker
      const removed = entry.source.value.ref
      if (!removed) {
        return
      }
      if (!ast.isElement(removed)) {
        accept('error', 'Only model elements can be removed', {
          node: entry,
          property: 'source',
        })
        return
      }
      const addedBy = AstUtils.getContainerOfType(removed, ast.isModelDiff)
      if (addedBy) {
        accept('error', `Element is added by diff "${addedBy.name}", it cannot be removed`, {
          node: entry,
          property: 'source',
        })
      }
      return
    }

    const doc = AstUtils.getDocument(entry)
    const parser = modelParser.forDocument(doc)
    const source = safeCall(() => parser.parseFqnRef(entry.source))
    const target = safeCall(() => entry.target ? parser.parseFqnRef(entry.target) : null)
    if (!source || !target) {
      return
    }
    if (!FqnRef.isElementRef(source) || !FqnRef.isElementRef(target)) {
      accept('error', 'Source and target must reference model elements', {
        node: entry,
      })
      return
    }
    const removal = parser.parseRemoveEntry(entry)
    if ('fingerprint' in removal && !getProjectFingerprints(projectIdFrom(doc)).has(removal.fingerprint)) {
      accept(
        'error',
        'No relation matches (by source, kind, target, title and direction). The model may have changed since the diff was written',
        {
          node: entry,
        },
      )
    }
  })
}
