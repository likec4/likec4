import { computed, createSingletonComposable } from 'reactive-vscode'
import type { TextDocumentFilter } from 'vscode-languageclient'
import { languageId } from '../const'

const useDocumentSelector = createSingletonComposable(() => {
  return computed(() => {
    return [
      { language: languageId, scheme: 'file' },
      { language: languageId, scheme: 'vscode-vfs' },
      { language: languageId, scheme: 'vscode-test-web' },
      { language: languageId, scheme: 'vscode-remote' },
    ] satisfies TextDocumentFilter[]
  })
})

export default useDocumentSelector
