import * as monaco from '@codingame/monaco-vscode-editor-api'
import editorWorkerUrl from '@codingame/monaco-vscode-editor-api/esm/vs/editor/editor.worker?worker&url'
import {
  RegisteredFileSystemProvider,
  registerFileSystemOverlay,
} from '@codingame/monaco-vscode-files-service-override'
import textMateWorkerUrl from '@codingame/monaco-vscode-textmate-service-override/worker?worker&url'
import LikeC4LspWorker from '@likec4/language-server/browser-worker?worker'
import type { EditorAppConfig } from 'monaco-languageclient/editorApp'
import { type ConnectionConfig, type LanguageClientConfig, LcWorker } from 'monaco-languageclient/lcwrapper'
import type { MonacoVscodeApiConfig } from 'monaco-languageclient/vscodeApiWrapper'
import { useWorkerFactory, Worker as WorkerDescriptor } from 'monaco-languageclient/workerFactory'
import { first } from 'remeda'
import languageConfig from '../../language-configuration.json?raw'
import textmateGrammar from '../../likec4.tmLanguage.json?raw'

export type CustomWrapperConfig = {
  vscodeApiConfig: MonacoVscodeApiConfig
  editorAppConfig: EditorAppConfig
  languageClientConfig: LanguageClientConfig
  fsProvider: RegisteredFileSystemProvider
}

/**
 * Editor workers, bundled by Vite (`?worker&url`).
 * The default factory of monaco-languageclient resolves bare module paths via `new URL(..., import.meta.url)`,
 * which does not work with Vite's dependency pre-bundling.
 */
const configureWorkerFactory = () =>
  useWorkerFactory({
    workerLoaders: {
      editorWorkerService: () => new WorkerDescriptor(editorWorkerUrl, { type: 'module' }),
      TextMateWorker: () => new WorkerDescriptor(textMateWorkerUrl, { type: 'module' }),
    },
  })

export const LIKEC4_LANGUAGE_ID = 'likec4'

/**
 * Worker connection that spawns the bundled LikeC4 language server worker.
 * A fresh worker is created on every (re)start, as the previous one is terminated on dispose.
 */
class LikeC4LcWorker extends LcWorker {
  override init(languageId: string, connectionConfig: ConnectionConfig, support: Parameters<LcWorker['init']>[2]) {
    if (!this.getWorker()) {
      this.updateWorker(loadLikeC4Worker())
    }
    return super.init(languageId, connectionConfig, support)
  }
}

export type MonacoEditorApp = monaco.editor.IStandaloneCodeEditor

export const createWrapperConfig = (params: {
  onActiveEditorChanged?: (filename: string) => void
  getActiveEditor: () => MonacoEditorApp | null
}): CustomWrapperConfig => {
  console.log('createWrapperConfig')
  const extensionFilesOrContents = new Map<string, string | URL>()
  extensionFilesOrContents.set(`/likec4-language-configuration.json`, languageConfig)
  extensionFilesOrContents.set(`/likec4-language-grammar.json`, textmateGrammar)

  const fsProvider = new RegisteredFileSystemProvider(false)
  registerFileSystemOverlay(1, fsProvider)

  const vscodeApiConfig: MonacoVscodeApiConfig = {
    $type: 'extended',
    logLevel: 2,
    viewsConfig: {
      $type: 'EditorService',
      openEditorFunc: async (modelRef) => {
        const editor = first(monaco.editor.getEditors())
        if (!editor) {
          return undefined
        }
        const nextFilename = modelRef.object.textEditorModel.uri.path.slice(1)
        params.onActiveEditorChanged?.(nextFilename)
        editor.setModel(modelRef.object.textEditorModel)
        return editor
      },
    },
    advanced: {
      loadThemes: true,
      enableExtHostWorker: false,
    },
    monacoWorkerFactory: configureWorkerFactory,
    userConfiguration: {
      json: JSON.stringify({
        'workbench.colorTheme': 'Default Dark+',
        'editor.guides.bracketPairsHorizontal': 'active',
        'editor.wordBasedSuggestions': 'off',
        'editor.experimental.asyncTokenization': true,
      }),
    },
    extensions: [{
      config: {
        name: `likec4`,
        publisher: 'likec4',
        version: '1.0.0',
        engines: {
          vscode: '*',
        },
        contributes: {
          languages: [{
            id: 'likec4',
            extensions: ['.c4'],
            aliases: ['likec4', 'LikeC4'],
            configuration: `/likec4-language-configuration.json`,
          }],
          grammars: [{
            language: 'likec4',
            scopeName: 'source.likec4',
            path: `/likec4-language-grammar.json`,
            embeddedLanguages: {
              'meta.embedded.block.markdown': 'markdown',
            },
          }],
        },
      },
      filesOrContents: extensionFilesOrContents,
    }],
  }

  const editorAppConfig: EditorAppConfig = {
    logLevel: 2,
    useDiffEditor: false,
    editorOptions: {
      codeLens: true,
      'semanticHighlighting.enabled': true,
      wordBasedSuggestions: 'off',
      theme: 'Default Dark+',
      minimap: {
        enabled: false,
      },
      'scrollbar': {
        vertical: 'hidden',
      },
      stickyScroll: {
        enabled: false,
      },
      'guides': {
        // indentation: false,
        // bracketPairs: false,
        // bracketPairsHorizontal: 'active'
        // bracketPairs: 'active',
        // highlightActiveIndentation: false
      },
      'lineNumbersMinChars': 3,
      'fontFamily': 'Fira Code',
      'fontWeight': '500',
      'fontSize': 13,
      'lineHeight': 20,
      'renderLineHighlightOnlyWhenFocus': true,
      'foldingHighlight': false,
      'overviewRulerBorder': false,
      'overviewRulerLanes': 0,
      'hideCursorInOverviewRuler': true,
    },
  }

  const languageClientConfig: LanguageClientConfig = {
    languageId: LIKEC4_LANGUAGE_ID,
    clientOptions: {
      workspaceFolder: {
        index: 0,
        name: 'playground',
        uri: monaco.Uri.parse('file:///'),
      },
      documentSelector: [{ language: LIKEC4_LANGUAGE_ID }],
      markdown: {
        isTrusted: true,
        supportHtml: true,
      },
    },
    connection: {
      options: {
        $family: 'Worker',
        // The worker is created by `LikeC4LcWorker` (bundled by Vite), the URL is not used
        workerUrl: new URL('about:blank'),
        type: 'module',
        disposeResources: true,
        realization: () => new LikeC4LcWorker(),
      },
      retryConfig: {
        disposeOnRestart: true,
      },
    },
  }

  return {
    vscodeApiConfig,
    editorAppConfig,
    languageClientConfig,
    fsProvider,
  }
}

export const loadLikeC4Worker = () => {
  return new LikeC4LspWorker()
}
