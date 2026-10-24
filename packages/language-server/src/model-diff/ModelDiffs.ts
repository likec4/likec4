import type { DiagramView, DiffId, DiffSummary, ParsedLikeC4ModelData, ProjectId, ViewId } from '@likec4/core'
import {
  type CompareModels,
  type CompareViewResult,
  computeCompareViews,
  createCompareModels,
} from '@likec4/core/compute-view'
import { getOrCreate } from '@likec4/core/utils'
import { AstUtils } from 'langium'
import { keys, values } from 'remeda'
import { type Position, type Range, DiagnosticSeverity } from 'vscode-languageserver-types'
import type { ast } from '../ast'
import { relationFingerprint } from '../model/relationFingerprint'
import type { LikeC4Services } from '../module'
import { diffRange, mergeDiffAdds, modelBlockWith } from './merge-apply'
import { findDiffOverlaps, overlapsOf } from './overlaps'
import type { DocumentEdits } from './text-edits'

export type DiffAction = 'apply' | 'discard'

function isWithin(inner: Range, outer: Range): boolean {
  const notAfter = (a: Position, b: Position) => a.line < b.line || (a.line === b.line && a.character <= b.character)
  return notAfter(outer.start, inner.start) && notAfter(inner.end, outer.end)
}

interface CompareEntry {
  models: CompareModels
  views: CompareViewResult[]
}

/**
 * Model diffs: summaries, compare views, and the edits that apply or discard a diff.
 */
export class LikeC4ModelDiffs {
  // Keyed by parsed model data, which is recreated when the model changes
  readonly #cache = new WeakMap<ParsedLikeC4ModelData, Map<DiffId, CompareEntry | null>>()

  constructor(private services: LikeC4Services) {}

  private compare(data: ParsedLikeC4ModelData, diffId: DiffId): CompareEntry | null {
    const byDiff = getOrCreate(this.#cache, data, () => new Map<DiffId, CompareEntry | null>())
    return getOrCreate(byDiff, diffId, () => {
      const models = createCompareModels(data, diffId)
      return models && { models, views: computeCompareViews(data, models) }
    })
  }

  /**
   * Diffs of the project with their number of changes and the views they change.
   */
  async list(projectId?: ProjectId): Promise<DiffSummary[]> {
    const model = await this.services.likec4.ModelBuilder.parseModel(projectId)
    if (!model) {
      return []
    }
    const data = model.$data
    return values(data.diffs ?? {}).flatMap(diff => {
      const entry = this.compare(data, diff.id)
      if (!entry) {
        return []
      }
      return [{
        id: diff.id,
        title: diff.title,
        description: diff.description ?? null,
        added: {
          elements: keys(diff.add.elements).length,
          relations: keys(diff.add.relations).length,
        },
        removed: {
          elements: diff.remove.elements.length,
          relations: diff.remove.relations.length,
        },
        modified: {
          elements: keys(diff.modify.elements).length,
        },
        views: entry.views
          .filter(result => result.isAffected)
          .map(result => ({
            id: result.view.id,
            title: result.view.title,
            nodes: result.nodes,
            edges: result.edges,
          })),
      }]
    })
  }

  /**
   * Lays out the compare view: the view before and after the diff, merged into one diagram.
   * Returns `null` if the view exists in neither state.
   */
  async layoutCompareView(params: {
    viewId: ViewId
    diffId: DiffId
    projectId?: ProjectId | undefined
  }): Promise<DiagramView | null> {
    const model = await this.services.likec4.ModelBuilder.parseModel(params.projectId)
    if (!model) {
      return null
    }
    const result = this.compare(model.$data, params.diffId)?.views.find(r => r.view.id === params.viewId)
    if (!result) {
      return null
    }
    const { diagram } = await this.services.likec4.Layouter.layout({ view: result.view, styles: model.$styles })
    return diagram
  }

  /**
   * What must be resolved by people before the diff is applied:
   * errors inside the diff, and overlaps with other diffs (as `<other diff>: <what overlaps>`).
   */
  checkBeforeApply(diffId: DiffId, projectId?: ProjectId): { errors: string[]; overlaps: string[] } {
    const id = this.services.shared.workspace.ProjectsManager.ensureProjectId(projectId)
    const errors = this.diffNodes(id, diffId).flatMap(node => {
      const range = node.$cstNode?.range
      return (AstUtils.getDocument(node).diagnostics ?? [])
        .filter(d => d.severity === DiagnosticSeverity.Error && !!range && isWithin(d.range, range))
        .map(d => typeof d.message === 'string' ? d.message : d.message.value)
    })
    const overlaps = overlapsOf(findDiffOverlaps(this.services.likec4.ModelParser.documents(id).toArray()), diffId)
    return { errors, overlaps }
  }

  private diffNodes(projectId: ProjectId, diffId: DiffId): ast.ModelDiff[] {
    return this.services.shared.workspace.LangiumDocuments
      .projectDocuments(projectId)
      .toArray()
      .flatMap(document => document.parseResult.value.diffs.filter(diff => diff.name === diffId))
  }

  private addRelationRemovals(edits: DocumentEdits, projectId: ProjectId, relationIds: ReadonlyArray<string>) {
    if (relationIds.length === 0) {
      return
    }
    const locator = this.services.workspace.AstNodeLocator
    const removed = new Set(relationIds)
    const fingerprints = new Set<string>()
    const documents = this.services.likec4.ModelParser.documents(projectId).toArray()
    for (const document of documents) {
      for (const relation of document.c4Relations) {
        if (!removed.has(relation.id)) {
          continue
        }
        fingerprints.add(relationFingerprint(relation))
        const node = locator.getAstNode(document.parseResult.value, relation.astPath)
        if (node) {
          edits.deleteNode(node)
        }
      }
    }
    for (const document of documents) {
      for (const extend of document.c4ExtendRelations) {
        const node = fingerprints.has(extend.id)
          ? locator.getAstNode(document.parseResult.value, extend.astPath)
          : undefined
        if (node) {
          edits.deleteNode(node)
        }
      }
    }
  }

  /**
   * Computes edits that apply the diff to the model or discard it.
   *
   * Apply: removes elements and relations listed in `remove` (with everything that references them),
   * merges the `add` blocks into the model definitions, and deletes the diff.
   * Discard: deletes the diff.
   * The comment lines right above the diff are deleted with it.
   */
  async addEdits(edits: DocumentEdits, diffId: DiffId, action: DiffAction, projectId?: ProjectId): Promise<boolean> {
    const model = await this.services.likec4.ModelBuilder.parseModel(projectId)
    if (!model) {
      return false
    }
    const modelProjectId = model.projectId as ProjectId
    const diffNodes = this.diffNodes(modelProjectId, diffId)
    if (diffNodes.length === 0) {
      return false
    }
    const diff = model.$data.diffs?.[diffId]
    if (action === 'apply' && diff) {
      if (diff.remove.elements.length > 0) {
        await this.services.likec4.RemovalImpact.addEdits(edits, diff.remove.elements, modelProjectId, {
          includeScopedViews: true,
          includeDynamicSteps: true,
        })
      }
      this.addRelationRemovals(edits, modelProjectId, diff.remove.relations)
    }
    const documents = this.services.shared.workspace.LangiumDocuments.projectDocuments(modelProjectId).toArray()
    for (const node of diffNodes) {
      const range = diffRange(node)
      if (!range) {
        continue
      }
      const unmerged = action === 'apply' ? mergeDiffAdds(edits, node, documents) : []
      edits.add(AstUtils.getDocument(node), {
        range,
        newText: unmerged.length > 0 ? modelBlockWith(unmerged) : '',
      })
    }
    return true
  }
}
