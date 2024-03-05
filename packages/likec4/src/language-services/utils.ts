import k from 'picocolors'
import { debounce } from 'remeda'
import { DiagnosticSeverity } from 'vscode-languageserver-protocol'
import { URI } from 'vscode-uri'
import type { CliServices } from './module'

export function languageServicesUtils(services: CliServices) {
  const logger = services.logger
  const metaData = services.LanguageMetaData
  const langiumDocuments = services.shared.workspace.LangiumDocuments
  const documentBuilder = services.shared.workspace.DocumentBuilder
  const modelBuilder = services.likec4.ModelBuilder

  function errorDiagnostics() {
    const docs = langiumDocuments.all.toArray()
    return docs.flatMap(doc => {
      return (doc.diagnostics ?? [])
        .filter(d => d.severity === DiagnosticSeverity.Error)
        .map(d => ({
          ...d,
          sourceFsPath: doc.uri.fsPath
        }))
    })
  }

  function hasErrors() {
    return errorDiagnostics().length > 0
  }

  const mutex = services.shared.workspace.WorkspaceLock

  // Returns true if the update was successful
  async function notifyUpdate({ changed, removed }: { changed?: string; removed?: string }) {
    logger.info(`notify update ${k.dim(changed ?? removed)}`)
    try {
      let completed = false
      await mutex.write(async token => {
        await documentBuilder.update(
          changed ? [URI.file(changed)] : [],
          removed ? [URI.file(removed)] : [],
          token
        )
        // we come here if only the update was successful (and not cancelled)
        completed = !token.isCancellationRequested
      })
      return completed
    } catch (e) {
      logger.error(e)
      return false
    }
  }

  function onModelUpdate(listener: () => void) {
    const notify = debounce(listener, {
      timing: 'both',
      waitMs: 250,
      maxWaitMs: 1000
    })
    const sib = modelBuilder.onModelParsed(() => notify.call())
    return () => {
      notify.cancel()
      sib.dispose()
    }
  }

  return {
    errorDiagnostics,
    hasErrors,
    notifyUpdate,
    onModelUpdate
  }
}
