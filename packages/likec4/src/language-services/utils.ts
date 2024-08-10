import consola from '@likec4/log'
import k from 'picocolors'
import { DiagnosticSeverity } from 'vscode-languageserver-types'
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
    consola.debug(`notify update ${k.dim(changed ?? removed)}`)
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
    const sib = modelBuilder.onModelParsed(() => listener())
    return () => {
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
