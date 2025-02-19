import type * as monaco from '@codingame/monaco-vscode-editor-api'
import languageConfig from '../../language-configuration.json?raw'
import textmateGrammar from '../../likec4.tmLanguage.json?raw' // import LikeC4LspWorker from './lsp/likec4.worker?worker'

import getEditorServiceOverride, { type OpenEditor } from '@codingame/monaco-vscode-editor-service-override'
import {
  RegisteredFileSystemProvider,
  registerFileSystemOverlay,
} from '@codingame/monaco-vscode-files-service-override'
import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override'
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override'
import { rootLogger } from '@likec4/log'
import type { LanguageClientConfig, WrapperConfig } from 'monaco-editor-wrapper'
import { configureMonacoWorkers, loadLikeC4Worker } from './utils'

export type CustomWrapperConfig = WrapperConfig & {
  fsProvider: RegisteredFileSystemProvider
}

export const createWrapperConfig = (params: {
  onActiveEditorChanged?: (filename: string) => void
  getActiveEditor: () => monaco.editor.ICodeEditor | null
}): CustomWrapperConfig => {
  const extensionFilesOrContents = new Map<string, string | URL>()
  extensionFilesOrContents.set(`/likec4-language-configuration.json`, languageConfig)
  extensionFilesOrContents.set(`/likec4-language-grammar.json`, textmateGrammar)

  const languageClientConfigs: Record<string, LanguageClientConfig> = {
    likec4: {
      name: 'likec4',
      clientOptions: {
        documentSelector: [{ language: 'likec4' }],
      },
      connection: {
        options: {
          $type: 'WorkerDirect',
          worker: loadLikeC4Worker(),
        },
      },
    },
  }

  // const ctx = params.playgroundActor.getSnapshot().context
  // const modified = {
  //   text: params.initialFile.text,
  //   uri: '/' + params.initialFile.filename,
  //   fileExt: 'c4',
  // }

  const fsProvider = new RegisteredFileSystemProvider(false)
  registerFileSystemOverlay(1, fsProvider)

  const openEditorFunc: OpenEditor = async (modelRef, opts, _sideBySide) => {
    const editor = params.getActiveEditor()
    if (!editor) {
      return undefined
    }
    const nextFilename = modelRef.object.textEditorModel.uri.path.slice(1)
    params.onActiveEditorChanged?.(nextFilename)
    editor.setModel(modelRef.object.textEditorModel)
    return editor
  }

  return {
    $type: 'extended',
    fsProvider,
    vscodeApiConfig: {
      viewsConfig: {
        viewServiceType: 'EditorService',
        openEditorFunc,
      },
      serviceOverrides: {
        ...getEditorServiceOverride(openEditorFunc),
        ...getThemeServiceOverride(),
        ...getTextmateServiceOverride(),
      },
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
      monacoWorkerFactory: configureMonacoWorkers,
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
            configuration: `./likec4-language-configuration.json`,
          }],
          grammars: [{
            language: 'likec4',
            scopeName: 'source.likec4',
            path: `./likec4-language-grammar.json`,
          }],
        },
      },
      filesOrContents: extensionFilesOrContents,
    }],
    languageClientConfigs,
  }
}
