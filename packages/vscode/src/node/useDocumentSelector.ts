import os from 'node:os'
import { computed, createSingletonComposable, useWorkspaceFolders } from 'reactive-vscode'
import vscode, { type DocumentFilter } from 'vscode'
import { useExtensionLogger } from '../common/useExtensionLogger'
import { globPattern, languageId } from '../const'

const useDocumentSelector = createSingletonComposable(() => {
  const logger = useExtensionLogger()
  const wFolders = useWorkspaceFolders()

  return computed(() => {
    const workspaceFolders = wFolders.value ?? []

    const isVirtual = wFolders.value?.every(f => f.uri.scheme !== 'file') || false
    if (workspaceFolders.length === 0) {
      logger.warn(`No workspace folder found`)
    }

    // The glob pattern used to find likec4 source files inside the workspace
    const scheme = isVirtual ? 'vscode-vfs' : 'file'
    const documentSelector = workspaceFolders.map((w): DocumentFilter => {
      return { language: languageId, scheme, pattern: new vscode.RelativePattern(w, globPattern) }
    })

    if (documentSelector.length === 0) {
      documentSelector.push({ language: languageId, scheme: 'vscode-vfs', pattern: globPattern })
    }

    documentSelector.push({ language: languageId, scheme: 'vscode-remote' })

    return documentSelector
  })
})

export default useDocumentSelector
