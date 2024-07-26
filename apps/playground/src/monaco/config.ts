import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override'
import getEditorServiceOverride from '@codingame/monaco-vscode-editor-service-override'
import getFileServiceOverride from '@codingame/monaco-vscode-files-service-override'
import * as monaco from 'monaco-editor'
import '@codingame/monaco-vscode-theme-defaults-default-extension'

import type { UserConfig } from 'monaco-editor-wrapper'
import { first } from 'remeda'
import { joinURL, withLeadingSlash, withProtocol } from 'ufo'
import type { ITextEditorOptions } from 'vscode/services'
import languageConfig from '../../language-configuration.json?raw'
import textmateGrammar from '../../likec4.tmLanguage.json?raw'
import type { StoreApi } from '../state'

import { DEV } from 'esm-env'
import LikeC4LspWorker from './lsp/likec4.worker?worker'

export function createMonacoConfig(store: StoreApi) {
  const state = store.getState()
  const name = state.name
  const filename = state.currentFilename
  const code = state.currentFileContent()

  const extensionFilesOrContents = new Map<string, string | URL>()
  // test both url and string content
  extensionFilesOrContents.set('/language-configuration.json', languageConfig)
  extensionFilesOrContents.set('/language-grammar.json', textmateGrammar)
  const workspaceUri = withProtocol(withLeadingSlash(name), 'file://')
  return {
    id: name,
    loggerConfig: {
      enabled: true,
      debugEnabled: DEV
    },
    wrapperConfig: {
      serviceConfig: {
        userServices: {
          ...getConfigurationServiceOverride(),
          ...getFileServiceOverride(),
          ...getEditorServiceOverride(async (modelRef, options, _sideBySide) => {
            const editor = first(monaco.editor.getEditors())
            if (!editor) {
              return undefined
            }
            const nextFilename = modelRef.object.textEditorModel.uri.toString().substring(
              workspaceUri.toString().length + 1
            )

            editor.setModel(modelRef.object.textEditorModel)
            const opts = options as (ITextEditorOptions | undefined)
            if (opts?.selection) {
              editor.setSelection({
                startLineNumber: opts.selection.startLineNumber,
                startColumn: opts.selection.startColumn,
                endLineNumber: opts.selection.endLineNumber ?? opts.selection.startLineNumber,
                endColumn: opts.selection.endColumn ?? opts.selection.startColumn
              }, opts.selectionSource)
              editor.revealLineNearTop(opts.selection.startLineNumber, 0)
            }

            store.setState({
              currentFilename: nextFilename
            })

            return editor
          })
        },
        debugLogging: DEV
      },
      editorAppConfig: {
        $type: 'extended',
        codeResources: {
          main: {
            uri: joinURL(workspaceUri, filename),
            fileExt: 'c4',
            text: code
          }
        },
        editorOptions: {
          'semanticHighlighting.enabled': true,
          wordBasedSuggestions: 'off',
          theme: 'Default Dark+',
          minimap: {
            enabled: false
          },
          'scrollbar': {
            vertical: 'hidden'
          },
          stickyScroll: {
            enabled: false
          },
          'guides': {
            indentation: false,
            bracketPairs: false,
            bracketPairsHorizontal: 'active'
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
          'hideCursorInOverviewRuler': true
        },
        useDiffEditor: false,
        extensions: [{
          config: {
            name: 'likec4-' + state.uniqueId,
            publisher: 'likec4',
            version: '1.0.0',
            engines: {
              vscode: '*'
            },
            contributes: {
              languages: [{
                id: 'likec4',
                extensions: ['.c4'],
                aliases: ['likec4', 'LikeC4'],
                configuration: './language-configuration.json'
              }],
              grammars: [{
                language: 'likec4',
                scopeName: 'source.likec4',
                path: './language-grammar.json'
              }]
            }
          },
          filesOrContents: extensionFilesOrContents
        }],
        userConfiguration: {
          json: JSON.stringify({
            'workbench.colorTheme': 'Default Dark+'
          })
        }
      }
    },
    languageClientConfig: {
      languageId: 'likec4',
      name: 'likec4',
      // options: {
      //   $type: 'WorkerConfig',
      //   type: 'module',
      //   url: new URL('./lsp/likec4.worker', import.meta.url)
      // }
      options: {
        $type: 'WorkerDirect',
        worker: new LikeC4LspWorker({
          name: 'likec4-lsp-worker'
        })
        // type: 'module',
        // url: new URL('./lsp/likec4.worker.ts', import.meta.url)
      }
    }
  } satisfies UserConfig
}
