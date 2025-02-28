import { Scheme } from '@likec4/language-server/likec4lib'
import os from 'node:os'
import { computed, createSingletonComposable, useDisposable, useWorkspaceFolders } from 'reactive-vscode'
import vscode from 'vscode'
import type { TextDocumentFilter } from 'vscode-languageclient'
import { useExtensionLogger } from '../common/useExtensionLogger'
import { globPattern, languageId } from '../const'

function isWindows() {
  return os.platform() === 'win32'
}

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
    const documentSelector = (isWindows() || workspaceFolders.length === 0)
      ? [
        { language: languageId, scheme }, // TODO: Can't figure out why
      ]
      : workspaceFolders.map((f): TextDocumentFilter => {
        const w = vscode.Uri.joinPath(f.uri, globPattern)
        return { language: languageId, scheme, pattern: w.scheme === 'file' ? w.fsPath : w.path }
      })

    documentSelector.push({ language: languageId, scheme: 'vscode-remote' })

    return documentSelector
  })
})

export default useDocumentSelector
