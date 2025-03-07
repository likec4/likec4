import TextEditorWorker from '@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker.js?worker'
import TextMateWorker from '@codingame/monaco-vscode-textmate-service-override/worker?worker'
import LikeC4LspWorker from '@likec4/language-server/browser-worker?worker'
import { type WorkerLoader, useWorkerFactory } from 'monaco-languageclient/workerFactory'

export const defineDefaultWorkerLoaders: () => Record<string, WorkerLoader> = () => {
  return {
    TextEditorWorker: () => new TextEditorWorker(),
    TextMateWorker: () => new TextMateWorker(),
    // these are other possible workers not configured by default
    OutputLinkDetectionWorker: undefined,
    LanguageDetectionWorker: undefined,
    NotebookEditorWorker: undefined,
    LocalFileSearchWorker: undefined,
  }
}

export const configureMonacoWorkers = (logger?: any) => {
  useWorkerFactory({
    workerLoaders: defineDefaultWorkerLoaders(),
    ...(logger && { logger }),
  })
}

export const loadLikeC4Worker = () => {
  return new LikeC4LspWorker()
}
