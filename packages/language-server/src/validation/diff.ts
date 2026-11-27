import type { LikeC4Services } from '../module'
import { type ProjectId, DiffId, FqnRef } from '@likec4/core'
import { type ValidationCheck, AstUtils, DocumentState, WorkspaceCache } from 'langium'
import { ast } from '../ast'
import { type DiffOverlap, findDiffOverlaps, overlapsOf } from '../model-diff/overlaps'
import { relationFingerprint } from '../model/relationFingerprint'
import { projectIdFrom, safeCall } from '../utils'
import { tryOrLog } from './_shared'

function hasChanges(diff: ast.ModelDiff): boolean {
  return diff.removes.length > 0 || diff.adds.length > 0 || diff.viewBlocks.length > 0
}

export const modelDiffChecks = (services: LikeC4Services): ValidationCheck<ast.ModelDiff> => {
  const cache = new WorkspaceCache<ProjectId, DiffOverlap[]>(services.shared, DocumentState.Linked)
  const overlapsIn = (projectId: ProjectId) =>
    cache.get(projectId, () => findDiffOverlaps(services.likec4.ModelParser.documents(projectId).toArray()))

  // Diffs with the same name are merged, so a part with only a title or description is fine
  // as long as another part of the same diff has changes
  const changedCache = new WorkspaceCache<ProjectId, Set<string>>(services.shared, DocumentState.Linked)
  const changedDiffsIn = (projectId: ProjectId) =>
    changedCache.get(projectId, () =>
      new Set(
        services.shared.workspace.LangiumDocuments.projectDocuments(projectId)
          .flatMap(doc => (doc.parseResult.value as ast.LikeC4Grammar).diffs ?? [])
          .filter(hasChanges)
          .map(diff => diff.name),
      ))

  return tryOrLog((diff, accept) => {
    const projectId = projectIdFrom(AstUtils.getDocument(diff))
    if (!hasChanges(diff) && !changedDiffsIn(projectId).has(diff.name)) {
      accept('warning', 'Diff has no changes', {
        node: diff,
        property: 'name',
      })
    }
    const index = services.shared.workspace.IndexManager
    for (const view of diff.viewBlocks.flatMap(block => block.views)) {
      if (!view.name) {
        continue
      }
      const sameName = [ast.ElementView, ast.DynamicView, ast.DeploymentView]
        .flatMap(type => index.projectElements(projectId, type.$type).filter(node => node.name === view.name).toArray())
      if (sameName.length > 1) {
        accept('error', `Duplicate view '${view.name}'`, {
          node: view,
          property: 'name',
        })
      }
    }
    for (const node of diff.adds.flatMap(add => add.elements).filter(ast.isExtendRelation)) {
      accept('error', 'Diff cannot extend relations. Remove the relation and add a new one instead', { node })
    }
    for (const overlap of overlapsOf(overlapsIn(projectId), DiffId(diff.name))) {
      accept('warning', `Overlaps with diff ${overlap}. Agree on it with the owners of both diffs`, {
        node: diff,
        property: 'name',
      })
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
