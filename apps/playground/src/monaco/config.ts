import * as monaco from '@codingame/monaco-vscode-editor-api'
import { type OpenEditor } from '@codingame/monaco-vscode-editor-service-override'

import {
  RegisteredFileSystemProvider,
  registerFileSystemOverlay,
} from '@codingame/monaco-vscode-files-service-override'
import LikeC4LspWorker from '@likec4/language-server/browser-worker?worker'
import type { WrapperConfig } from 'monaco-editor-wrapper'
import { configureDefaultWorkerFactory } from 'monaco-editor-wrapper/workers/workerLoaders'
import { first } from 'remeda'
import languageConfig from '../../language-configuration.json?raw'
import textmateGrammar from '../../likec4.tmLanguage.json?raw'

export type CustomWrapperConfig = WrapperConfig & {
  fsProvider: RegisteredFileSystemProvider
}

export const createWrapperConfig = (params: {
  // playgroundActorRef: PlaygroundActorRef
  onActiveEditorChanged?: (filename: string) => void
  getActiveEditor: () => monaco.editor.ICodeEditor | null
}): CustomWrapperConfig => {
  console.log('createWrapperConfig')
  const extensionFilesOrContents = new Map<string, string | URL>()
  extensionFilesOrContents.set(`/likec4-language-configuration.json`, languageConfig)
  extensionFilesOrContents.set(`/likec4-language-grammar.json`, textmateGrammar)

  const fsProvider = new RegisteredFileSystemProvider(false)
  registerFileSystemOverlay(1, fsProvider)

  const openEditorFunc: OpenEditor = async (modelRef, opts, _sideBySide) => {
    const editor = first(monaco.editor.getEditors())
    if (!editor) {
      return undefined
    }
    const nextFilename = modelRef.object.textEditorModel.uri.path.slice(1)
    params.onActiveEditorChanged?.(nextFilename)
    editor.setModel(modelRef.object.textEditorModel)
    return editor
  }

  // const playgroundContext = params.playgroundActorRef.getSnapshot().context

  // const modified = {
  //   text: playgroundContext.files[playgroundContext.activeFilename] ?? '',
  //   uri: monaco.Uri.file(playgroundContext.activeFilename).toString(),
  //   enforceLanguageId: 'likec4',
  // }
  // console.debug('modified', modified)

  return {
    $type: 'extended',
    fsProvider,
    logLevel: 2,
    vscodeApiConfig: {
      loadThemes: true,
      viewsConfig: {
        viewServiceType: 'EditorService',
        openEditorFunc,
      },
      enableExtHostWorker: false,
      // serviceOverrides: {
      //   ...getEditorServiceOverride(openEditorFunc),
      //   ...getThemeServiceOverride(),
      //   ...getTextmateServiceOverride(),
      // },
      userConfiguration: {
        json: JSON.stringify({
          'workbench.colorTheme': 'Default Dark+',
          'editor.guides.bracketPairsHorizontal': 'active',
          'editor.wordBasedSuggestions': 'off',
          'editor.experimental.asyncTokenization': true,
        }),
      },
    },
    editorAppConfig: {
      useDiffEditor: false,
      monacoWorkerFactory: configureDefaultWorkerFactory,
      // codeResources: {
      //   modified,
      // },
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
          }],
        },
      },
      filesOrContents: extensionFilesOrContents,
    }],
    languageClientConfigs: {
      automaticallyInit: true,
      automaticallyStart: true,
      configs: {
        likec4: {
          name: 'likec4',
          clientOptions: {
            documentSelector: [{ language: 'likec4' }],
            markdown: {
              isTrusted: true,
              supportHtml: true,
            },
          },
          connection: {
            options: {
              $type: 'WorkerDirect',
              worker: loadLikeC4Worker(),
            },
          },
        },
      },
    },
  }
}

export const loadLikeC4Worker = () => {
  return new LikeC4LspWorker()
}
