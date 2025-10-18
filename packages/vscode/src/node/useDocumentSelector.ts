import { deepEqual } from 'fast-equals'
import { computed, createSingletonComposable, useWorkspaceFolders } from 'reactive-vscode'
import vscode from 'vscode'
import type { TextDocumentFilter } from 'vscode-languageclient'
import { globPattern, languageId } from '../const'
import { logger } from '../logger'

const useDocumentSelector = createSingletonComposable(() => {
  const wFolders = useWorkspaceFolders()

  return computed((old?: TextDocumentFilter[]): TextDocumentFilter[] => {
    try {
      const workspaceFolders = wFolders.value ?? []

      const isVirtual = workspaceFolders.every(f => f.uri.scheme !== 'file') || false

      if (workspaceFolders.length === 0) {
        logger.warn(`No workspace folder found`)
      }

      // The glob pattern used to find likec4 source files inside the workspace
      const scheme = isVirtual ? 'vscode-vfs' : 'file'
      const documentSelector = workspaceFolders.map((w): TextDocumentFilter => {
        return { language: languageId, scheme, pattern: new vscode.RelativePattern(w, globPattern).pattern }
      })

      if (documentSelector.length === 0) {
        documentSelector.push({ language: languageId, scheme: 'vscode-vfs', pattern: globPattern })
      }

      documentSelector.push({ language: languageId, scheme: 'vscode-remote', pattern: globPattern })

      return old && deepEqual(old, documentSelector) ? old : documentSelector
    } catch (error) {
      logger.error(`Failed to compute document selector`, { error })
      return old ?? [
        { language: languageId, scheme: 'file', pattern: globPattern },
        { language: languageId, scheme: 'vscode-remote', pattern: globPattern },
      ]
    }
  })
})

export default useDocumentSelector
