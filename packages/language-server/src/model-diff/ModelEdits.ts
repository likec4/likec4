import type { DiffId, ProjectId } from '@likec4/core'
import { stringHash } from '@likec4/core/utils'
import { URI, UriUtils } from 'langium'
import type { LikeC4Services } from '../module'
import { type ApplyEditsResult, applyDocumentEdits } from './apply-edits'
import type { DiffAction } from './ModelDiffs'
import type { SafeDeleteOptions } from './RemovalImpact'
import { type DocumentChange, DocumentEdits } from './text-edits'

/**
 * Change of the model sources that can be previewed, applied and rolled back.
 */
export type ModelEditRequest =
  | {
    type: 'apply-diff'
    diffId: DiffId
    action: DiffAction
    /**
     * Confirms that the owners of the overlapping diffs agreed (required to apply a diff that overlaps others)
     */
    acceptOverlaps?: boolean | undefined
  }
  | { type: 'safe-delete'; targets: ReadonlyArray<string>; options?: SafeDeleteOptions | undefined }

export interface ModelEditPreview {
  label: string
  /**
   * Identifies the previewed changes
   */
  token: string
  documents: DocumentChange[]
  /**
   * Overlaps with other diffs, as `<other diff>: <what overlaps>`.
   * Applying needs `acceptOverlaps`: overlaps are never resolved automatically.
   */
  overlaps: string[]
}

export interface ModelEditRecord {
  id: number
  label: string
}

export interface ModelEditResult extends ApplyEditsResult {
  /**
   * Applied edit, can be rolled back
   */
  edit?: ModelEditRecord
}

const MaxHistorySize = 20

function tokenOf(documents: ReadonlyArray<DocumentChange>): string {
  return stringHash(documents.map(d => `${d.uri}\n${d.after}`).join('\n') || 'empty')
}

function failed(error: string): ModelEditResult {
  return { applied: false, remaining: [], error }
}

/**
 * Edits of the model sources: preview before apply, and rollback of applied edits.
 * The history is kept in memory (it is lost when the language server restarts).
 */
export class LikeC4ModelEdits {
  readonly #history: Array<{ edit: ModelEditRecord; documents: DocumentChange[] }> = []
  #lastId = 0

  constructor(private services: LikeC4Services) {}

  private async collect(
    request: ModelEditRequest,
    projectId?: ProjectId,
  ): Promise<{ label: string; edits: DocumentEdits; overlaps: string[] } | { error: string }> {
    const edits = new DocumentEdits()
    if (request.type === 'apply-diff') {
      const diffs = this.services.likec4.ModelDiffs
      const { errors, overlaps } = request.action === 'apply'
        ? diffs.checkBeforeApply(request.diffId, projectId)
        : { errors: [], overlaps: [] }
      if (errors.length > 0) {
        return { error: `Diff ${request.diffId} has errors, fix them before applying: ${errors.join('; ')}` }
      }
      const found = await diffs.addEdits(edits, request.diffId, request.action, projectId)
      if (!found) {
        return { error: `Diff not found: ${request.diffId}` }
      }
      return { label: `${request.action === 'apply' ? 'Apply' : 'Discard'} diff ${request.diffId}`, edits, overlaps }
    }
    const impact = await this.services.likec4.RemovalImpact.addEdits(
      edits,
      request.targets,
      projectId,
      request.options ?? {},
    )
    if (impact.targets.length === 0) {
      return { error: `Element not found: ${request.targets.join(', ')}` }
    }
    return { label: `Safe delete ${impact.targets.join(', ')}`, edits, overlaps: [] }
  }

  /**
   * Computes the changes of the request without applying them.
   */
  async preview(request: ModelEditRequest, projectId?: ProjectId): Promise<ModelEditPreview | { error: string }> {
    const collected = await this.collect(request, projectId)
    if ('error' in collected) {
      return collected
    }
    const documents = collected.edits.preview()
    return { label: collected.label, token: tokenOf(documents), documents, overlaps: collected.overlaps }
  }

  /**
   * Applies the request and records it in the history.
   * With `token` (from the preview), the request is applied only if the changes are the same as in the preview.
   */
  async apply(
    request: ModelEditRequest,
    options?: { projectId?: ProjectId | undefined; token?: string | undefined },
  ): Promise<ModelEditResult> {
    const collected = await this.collect(request, options?.projectId)
    if ('error' in collected) {
      return failed(collected.error)
    }
    const { edits, label, overlaps } = collected
    if (overlaps.length > 0 && !(request.type === 'apply-diff' && request.acceptOverlaps)) {
      return failed(
        `${label}: the diff overlaps with other diffs (${overlaps.join('; ')}).`
          + ' Agree on it with the owners of these diffs, then accept the overlaps.',
      )
    }
    const documents = edits.preview()
    if (options?.token && options.token !== tokenOf(documents)) {
      return failed('The model changed after the preview. Review the changes again.')
    }
    const result = await applyDocumentEdits(this.services, edits, label)
    if (!result.applied || documents.length === 0) {
      return result
    }
    const edit = { id: ++this.#lastId, label }
    this.#history.push({ edit, documents })
    this.#history.splice(0, this.#history.length - MaxHistorySize)
    return { ...result, edit }
  }

  /**
   * Restores the documents to the state before the edit (the latest edit if `editId` is not set).
   * Fails if a document changed after the edit.
   */
  async rollback(editId?: number): Promise<ApplyEditsResult> {
    const index = editId === undefined ? this.#history.length - 1 : this.#history.findIndex(e => e.edit.id === editId)
    const entry = this.#history[index]
    if (!entry) {
      return failed('There is no edit to roll back')
    }
    const documents = this.services.shared.workspace.LangiumDocuments
    const edits = new DocumentEdits()
    for (const change of entry.documents) {
      const uri = URI.parse(change.uri)
      const document = documents.getDocument(uri)
      const current = document?.textDocument.getText()
      if (!document || current !== change.after) {
        return failed(`${UriUtils.basename(uri)} changed after "${entry.edit.label}", roll back is not possible`)
      }
      edits.add(document, {
        range: { start: { line: 0, character: 0 }, end: document.textDocument.positionAt(current.length) },
        newText: change.before,
      })
    }
    const result = await applyDocumentEdits(this.services, edits, `Roll back: ${entry.edit.label}`)
    if (result.applied) {
      this.#history.splice(index, 1)
    }
    return result
  }
}
