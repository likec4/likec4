import type { EditorApp } from 'monaco-languageclient/editorApp'
import type { LanguageClientManager } from 'monaco-languageclient/lcwrapper'

/**
 * Narrow view over the started editor and language clients,
 * assembled from the callbacks of `MonacoEditorReactComp`.
 */
export type MonacoHandle = {
  getEditor: EditorApp['getEditor']
  getLanguageClient: LanguageClientManager['getLanguageClient']
  getLanguageClientWrapper: LanguageClientManager['getLanguageClientWrapper']
}

export function createMonacoHandle(editorApp: EditorApp, languageClients: LanguageClientManager): MonacoHandle {
  return {
    getEditor: () => editorApp.getEditor(),
    getLanguageClient: (languageId) => languageClients.getLanguageClient(languageId),
    getLanguageClientWrapper: (languageId) => languageClients.getLanguageClientWrapper(languageId),
  }
}
