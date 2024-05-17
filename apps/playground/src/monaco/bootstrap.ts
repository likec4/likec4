import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory'
import EditorWorkerService from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
export const configureMonacoWorkers = () => {
  useWorkerFactory({
    ignoreMapping: true,
    workerLoaders: {
      // editorWorkerService: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
      editorWorkerService: () =>
        new EditorWorkerService({
          name: 'likec4-editor-worker'
        })
    }
  })
}
