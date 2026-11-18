import { DiffId } from '@likec4/core'
import type { LangiumDocument } from 'langium'
import { AstUtils, CstUtils, DocumentState, URI, UriUtils } from 'langium'
import { isPlainObject } from 'remeda'
import type { InitializeParams } from 'vscode-languageserver-protocol'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { type Diagnostic, type Range, type WorkspaceEdit, DiagnosticSeverity } from 'vscode-languageserver-types'
import { ast } from '../ast'
import type { FileSystemProvider } from '../filesystem/types'
import { logger as rootLogger } from '../logger'
import type { LikeC4Services, LikeC4SharedServices } from '../module'
import type { DocumentEdits } from './text-edits'

const logger = rootLogger.getChild('model-diff')

const initializeParams = new WeakMap<LikeC4SharedServices, InitializeParams>()

/**
 * Remembers what the client supports: confirmation of edits (client capabilities),
 * and the removal impact preview (`initializationOptions.removalImpactPreview`).
 */
export function trackClientCapabilities(shared: LikeC4SharedServices): void {
  shared.lsp.LanguageServer.onInitialize(params => {
    initializeParams.set(shared, params)
  })
}

/**
 * Whether the client shows the removal impact preview (handles `likec4/onRequestRemovalImpact`).
 */
export function clientPreviewsRemovalImpact(shared: LikeC4SharedServices): boolean {
  const options: unknown = initializeParams.get(shared)?.initializationOptions
  return isPlainObject(options) && options['removalImpactPreview'] === true
}

export interface RemainingError {
  uri: string
  range: Range
  message: string
  /**
   * Diff with the error (the edit broke it)
   */
  diffId?: DiffId
}

export interface ApplyEditsResult {
  applied: boolean
  /**
   * Errors in the changed documents, and new errors in other documents (for example, in other diffs)
   */
  remaining: RemainingError[]
  error?: string
}

const ConfirmAnnotation = 'likec4.confirm'

function withConfirmation(edit: WorkspaceEdit, label: string): WorkspaceEdit {
  return {
    documentChanges: Object.entries(edit.changes ?? {}).map(([uri, edits]) => ({
      textDocument: { uri, version: null },
      edits: edits.map(e => ({ ...e, annotationId: ConfirmAnnotation })),
    })),
    changeAnnotations: {
      [ConfirmAnnotation]: {
        label,
        needsConfirmation: true,
      },
    },
  }
}

function errorsOf(document: LangiumDocument): Diagnostic[] {
  return (document.diagnostics ?? []).filter(d => d.severity === DiagnosticSeverity.Error)
}

function diagnosticText(message: Diagnostic['message']): string {
  return typeof message === 'string' ? message : message.value
}

function errorKey(document: LangiumDocument, { range, message }: Diagnostic): string {
  return `${document.uri.toString()}|${range.start.line}:${range.start.character}|${diagnosticText(message)}`
}

function errorKeys(services: LikeC4Services): Set<string> {
  return new Set(
    services.shared.workspace.LangiumDocuments.all.toArray().flatMap(d => errorsOf(d).map(e => errorKey(d, e))),
  )
}

function diffAt(document: LangiumDocument, range: Range): DiffId | undefined {
  const root = document.parseResult.value.$cstNode
  const node = root && CstUtils.findLeafNodeAtOffset(root, document.textDocument.offsetAt(range.start))?.astNode
  const diff = AstUtils.getContainerOfType(node, ast.isModelDiff)
  return diff ? DiffId(diff.name) : undefined
}

/**
 * Errors in the changed documents, and errors that are new in other documents.
 */
function collectErrors(
  services: LikeC4Services,
  uris: ReadonlyArray<URI>,
  before: ReadonlySet<string>,
): RemainingError[] {
  const changed = new Set(uris.map(uri => uri.toString()))
  return services.shared.workspace.LangiumDocuments.all.toArray().flatMap(document =>
    errorsOf(document)
      .filter(e => changed.has(document.uri.toString()) || !before.has(errorKey(document, e)))
      .map(e => {
        const diffId = diffAt(document, e.range)
        return {
          uri: document.uri.toString(),
          range: e.range,
          message: diagnosticText(e.message),
          ...(diffId && { diffId }),
        }
      })
  )
}

/**
 * Resolves when the documents are rebuilt after the edit (or after the timeout).
 */
function waitForRebuild(
  services: LikeC4Services,
  previousVersions: ReadonlyMap<string, number>,
  timeoutMs = 5000,
): Promise<void> {
  const workspace = services.shared.workspace
  const isRebuilt = () =>
    [...previousVersions].every(([uri, version]) => {
      const document = workspace.LangiumDocuments.getDocument(URI.parse(uri))
      return !document || (document.textDocument.version !== version && document.state >= DocumentState.Validated)
    })
  if (isRebuilt()) {
    return Promise.resolve()
  }
  return new Promise(resolve => {
    const subscription = workspace.DocumentBuilder.onBuildPhase(DocumentState.Validated, () => {
      if (isRebuilt()) {
        clearTimeout(timer)
        subscription.dispose()
        resolve()
      }
    })
    const timer = setTimeout(() => {
      logger.warn`documents were not rebuilt in ${timeoutMs}ms after the edit`
      subscription.dispose()
      resolve()
    }, timeoutMs)
    // Do not keep Node.js process alive (in browsers timer is a number)
    if (typeof timer === 'object') {
      timer.unref()
    }
  })
}

/**
 * Writes the edited documents to their files.
 * If a write fails, the files written before it are restored. The error names a file that cannot be restored.
 * Returns the error, or `null` if all files are written.
 */
async function writeFiles(
  fileSystem: FileSystemProvider,
  documents: ReadonlyArray<LangiumDocument>,
  edit: WorkspaceEdit,
): Promise<string | null> {
  const written: LangiumDocument[] = []
  try {
    for (const document of documents) {
      const text = TextDocument.applyEdits(document.textDocument, edit.changes?.[document.uri.toString()] ?? [])
      await fileSystem.writeFile(document.uri, text)
      written.push(document)
    }
    return null
  } catch (error) {
    const notRestored: string[] = []
    for (const document of written) {
      try {
        await fileSystem.writeFile(document.uri, document.textDocument.getText())
      } catch {
        notRestored.push(document.uri.fsPath)
      }
    }
    const message = `The edit was not applied: ${error instanceof Error ? error.message : String(error)}`
    return notRestored.length > 0 ? `${message}. Restore failed, check ${notRestored.join(', ')}` : message
  }
}

/**
 * Applies the edits and reports errors left in the changed documents, and errors the edit caused elsewhere.
 *
 * With an LSP connection the edit is sent to the client (the client asks for confirmation if it supports it).
 * Without a connection (CLI, MCP, SDK) the files are written directly. If a write fails (for example, a workspace
 * without a file system), no file changes and the result is not applied.
 */
export async function applyDocumentEdits(
  services: LikeC4Services,
  edits: DocumentEdits,
  label: string,
): Promise<ApplyEditsResult> {
  const shared = services.shared
  const workspace = shared.workspace
  const edit = edits.toWorkspaceEdit()
  const documents: LangiumDocument[] = edits.documents
  const uris = documents.map(d => d.uri)
  const connection = shared.lsp.Connection
  const errorsBefore = errorKeys(services)

  if (!connection) {
    const error = await writeFiles(workspace.FileSystemProvider, documents, edit)
    if (error) {
      return { applied: false, remaining: [], error }
    }
    await workspace.DocumentBuilder.update(uris, [])
    return { applied: true, remaining: collectErrors(services, uris, errorsBefore) }
  }

  const versions = new Map(documents.map(d => [d.uri.toString(), d.textDocument.version]))
  const supportsConfirmation = !!initializeParams.get(shared)?.capabilities.workspace?.workspaceEdit
    ?.changeAnnotationSupport
  const result = await connection.workspace.applyEdit({
    label,
    edit: supportsConfirmation ? withConfirmation(edit, label) : edit,
  })
  if (!result.applied) {
    logger.debug`edit ${label} was not applied: ${result.failureReason}`
    return { applied: false, remaining: [], error: result.failureReason ?? 'The edit was not applied' }
  }
  await waitForRebuild(services, versions)
  logger.debug`applied ${label} to ${uris.map(u => UriUtils.basename(u)).join(', ')}`
  return { applied: true, remaining: collectErrors(services, uris, errorsBefore) }
}
