import { computed, defineService, shallowRef } from 'reactive-vscode'
import type { TextDocumentFilter } from 'vscode-languageclient'
import { languageId } from '../const'

const useDocumentSelector = defineService(() => {
  const selector = shallowRef(
    [
      { language: languageId, scheme: 'file' },
      { language: languageId, scheme: 'vscode-vfs' },
      { language: languageId, scheme: 'vscode-test-web' },
      { language: languageId, scheme: 'vscode-remote' },
    ] satisfies TextDocumentFilter[],
  )
  return computed(() => selector.value)
})

export default useDocumentSelector
