import { invariant } from '@likec4/core'
import { shallowEqual } from 'fast-equals'
import {
  type LangiumDocument,
  type URI,
  DefaultDocumentBuilder,
  Disposable,
  DocumentState,
  MultiMap,
} from 'langium'
import {
  type LikeC4LangiumDocument,
  type ValidatedLikeC4LangiumDocument,
  calcValidationHash,
  isErrorDiagnostic,
  isLikeC4LangiumDocument,
  isValidatedLikeC4LangiumDocument,
} from '../ast'
import { isNotLikeC4Builtin } from '../likec4lib'
import { serverLogger } from '../logger'
import type { LikeC4SharedServices } from '../module'

type DocumentStateReset = Exclude<DocumentState, DocumentState.Validated>

export type DocumentStateResetListener = (params: {
  doc: LikeC4LangiumDocument
  /**
   * State the document is being reset to
   */
  resetTo: DocumentStateReset
  /**
   * State the document was in before reset
   */
  previous: Exclude<DocumentState, DocumentState.Changed>
}) => void

export type DocumentValidationChangedListener<T extends {} | unknown = { validationHash: string }> = {
  /**
   * Optional function to extract a value from the validation state
   * to be compared for changes (by default validation hash is used)
   */
  select?: (state: {
    validationHash: string
    doc: ValidatedLikeC4LangiumDocument
    hasErrors: boolean
    isValid: boolean
  }) => T
  /**
   * Called when validation result changes
   */
  listener: (
    params: Readonly<{
      doc: ValidatedLikeC4LangiumDocument
      current: T
      previous: T | undefined
      hasErrors: boolean
      isValid: boolean
      // True if this is the first time the document is validated
      firstTime: boolean
    }>,
  ) => void
}

export class LikeC4DocumentBuilder extends DefaultDocumentBuilder {
  #logger = serverLogger.getChild('document-builder')

  protected readonly stateResetListeners = new MultiMap<
    Exclude<DocumentState, DocumentState.Changed>,
    DocumentStateResetListener
  >()

  protected readonly validationChangedListeners = new Map<
    Required<DocumentValidationChangedListener<any>>,
    Record<string, {}>
  >()

  constructor(protected services: LikeC4SharedServices) {
    super(services)
    this.documentPhaseListeners.add(DocumentState.Validated, (doc) => {
      if (isValidatedLikeC4LangiumDocument(doc) && isNotLikeC4Builtin(doc)) {
        // For each listener, check if result changed
        for (const [listener, documents] of this.validationChangedListeners) {
          const previous = documents[doc.textDocument.uri]
          const hasErrors = doc.diagnostics.some(isErrorDiagnostic)
          // Calculate current state
          const current = listener.select({
            validationHash: calcValidationHash(doc),
            doc,
            hasErrors,
            isValid: !hasErrors,
          })
          // Check if result changed
          if (!shallowEqual(previous, current)) {
            listener.listener({
              firstTime: previous === undefined,
              doc,
              current,
              previous,
              hasErrors,
              isValid: !hasErrors,
            })
          }
        }
      }
    })
  }

  /**
   * Returns the current phase of the document builder
   * .  "workaround"
   */
  get currentPhase() {
    return this.currentState
  }

  /**
   * Subscribe to document state reset events,
   * when document goes down from a state above the specified one, to the specified state or lower.
   *
   * @example
   * ```ts
   * onDocumentResetBelow(DocumentState.Linked, callback)
   * // Validated -> ComputedScopes: notified
   * // IndexedReferences -> Linked: notified
   * // Linked -> ComputedScopes: not notified (document was not above Linked)
   * ```
   *
   * @param state - Listener is notified when document goes down to this state or lower
   * @param callback - Function to call when document is reset
   * @returns Disposable to unsubscribe
   */
  onDocumentResetBelow(
    state: Exclude<DocumentState, DocumentState.Changed>,
    callback: DocumentStateResetListener,
  ): Disposable {
    this.stateResetListeners.add(state, callback)
    return Disposable.create(
      () => this.stateResetListeners.delete(state, callback),
    )
  }

  /**
   * Subscribe to document validation change events
   * (when document validation result changes)
   *
   * Triggered when document comes to DocumentState.Valid
   *
   * @param callback - Function to call when document validation changes
   * @returns Disposable to unsubscribe
   */
  onDocumentValidationChanged<T = { validationHash: string }>(
    listener: DocumentValidationChangedListener<T>,
  ): Disposable {
    const normalized = {
      select: ({ doc }) => ({ validationHash: calcValidationHash(doc) } as T),
      ...listener,
    } as Required<DocumentValidationChangedListener<T>>
    this.validationChangedListeners.set(normalized, {})
    return Disposable.create(
      () => this.validationChangedListeners.delete(normalized),
    )
  }

  protected notifyStateResetListeners(
    listenerState: Exclude<DocumentState, DocumentState.Changed>,
    params: Parameters<DocumentStateResetListener>[0],
  ): void {
    if (this.stateResetListeners.has(listenerState)) {
      this.stateResetListeners.get(listenerState).forEach(callback => callback(params))
    }
  }

  #resetInProgress: false | URI = false
  override resetToState(doc: LangiumDocument, resetTo: DocumentState): void {
    // Must not be in reset progress
    invariant(!this.#resetInProgress, `received resetToState while rese of ${this.#resetInProgress} is in progress`)

    this.#resetInProgress = doc.uri

    // Remember current state
    const previousState = doc.state as Exclude<DocumentState, DocumentState.Changed>
    // If we are moving from Validated to below, cache the validation hash
    if (previousState === DocumentState.Validated) {
      for (const [listener, visited] of this.validationChangedListeners) {
        try {
          const hasErrors = doc.diagnostics?.some(isErrorDiagnostic) ?? false
          visited[doc.textDocument.uri] = listener.select({
            doc: doc as ValidatedLikeC4LangiumDocument,
            validationHash: calcValidationHash(doc),
            hasErrors,
            isValid: !hasErrors,
          })
        } catch (error) {
          this.#logger.warn`Error on calculating validation state for document ${doc.uri}: ${error}`
        }
      }
    }

    try {
      // Reset to target state first
      super.resetToState(doc, resetTo)

      // Only notify if:
      // - resetTo is below current state (actually resetting)
      // - document is a LikeC4 document
      if (resetTo < previousState && isLikeC4LangiumDocument(doc)) {
        const params: Parameters<DocumentStateResetListener>[0] = {
          doc: doc,
          resetTo: resetTo as DocumentStateReset,
          previous: previousState,
        }
        // We notify listeners for each phase we're resetting backward
        for (let notifyState = previousState - 1; notifyState >= resetTo; notifyState--) {
          invariant(notifyState >= 0, 'notifyState must not be negative')
          try {
            this.notifyStateResetListeners(notifyState, params)
          } catch (error) {
            this.#logger.error('Error notifying state reset listener for state {notifyState}', {
              notifyState,
              error,
            })
          }
        }
      }
    } finally {
      this.#resetInProgress = false
    }
  }
}
