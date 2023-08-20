/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import 'monaco-editor/esm/vs/editor/edcore.main.js'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js'

import { StandaloneServices } from 'vscode/services'
// import getModelEditorServiceOverride from 'vscode/service-override/modelEditor'
import getDialogServiceOverride from 'vscode/service-override/dialogs'
import getNotificationServiceOverride from 'vscode/service-override/notifications'
// import getTokenClassificationServiceOverride from 'vscode/service-override/tokenClassification'

import { Editor, loader, type Monaco } from '@monaco-editor/react'
import { MonacoLanguageClient } from 'monaco-languageclient'
import { BrowserMessageReader, BrowserMessageWriter, CloseAction, ErrorAction } from 'vscode-languageclient/browser'

import { Fira_Code } from 'next/font/google'
import { once, toPairs } from 'rambdax'
import { useCallback, useEffect, useRef } from 'react'

import type { ViewID } from '@likec4/core'
import { useUnmountEffect } from '@react-hookz/web/esm'
import { useSetAtom } from 'jotai'
import { diagramIdAtom } from '../data/atoms'
import { useRevealRequestsHandler } from './useRevealRequestsHandler'
import { useLikeC4DataSync } from './useLikeC4DataSync'
import likec4Monarch from './likec4.monarch'

self.MonacoEnvironment = {
  getWorker(_, _label) {
    // if (label === 'json') {
    //   return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url))
    // }
    // if (label === 'typescript' || label === 'javascript') {
    //   return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url))
    // }
    return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), {
      name: 'monaco-editor-worker'
    })
  }
}

const firaCodeFont = Fira_Code({
  preload: true,
  weight: ['400', '500'],
  subsets: ['latin']
})

StandaloneServices.initialize({
  ...getNotificationServiceOverride(document.body),
  ...getDialogServiceOverride()
  // ...getModelEditorServiceOverride((_model, _options, _sideBySide) => {
  //   // const editor = getMonacoEditor()
  //   // if (!editor) {
  //   //   console.warn('no active editor')
  //   //   return Promise.resolve(undefined)
  //   // }
  //   // // const editorModel = editor.getModel() ?? null
  //   // // if (!editorModel || editorModel.uri.toString() !== model.uri.toString()) {
  //  // //   changeCurrentDocument(model.uri.toString())
  //   // // }
  //   return Promise.resolve(undefined)
  // })
})

loader.config({ monaco })

export const languageId = 'likec4'
const themeId = 'likec4PlaygroundTheme'

function useLikeC4LanguageClient() {
  const workerRef = useRef<Worker | null>(null)
  const languageClientRef = useRef<MonacoLanguageClient | null>(null)

  useUnmountEffect(() => {
    const languageClient = languageClientRef.current
    if (languageClient) {
      // switch (languageClient.state) {
      //   case State.Starting:   // Starting
      //   case State.Running: { // Running
      //     void languageClient.stop(5000).then(
      //       () => languageClient.dispose(5000)
      //     )
      //     break
      //   }
      //   case State.Stopped: { // Stopped
      //     void languageClient.dispose(5000)
      //     break
      //   }
      // }
      languageClientRef.current = null
    }
    // I don't know why this doesn't work
    //  languageClient.stop()
    // But seems we can just terminate the worker

    if (workerRef.current) {
      console.log('Stop worker')
      workerRef.current.terminate()
      workerRef.current = null
    }
  })

  const startLanguageClient = useCallback(() => {
    if (!languageClientRef.current) {
      console.debug('create likec4 language client')
      const worker = (workerRef.current = new Worker(new URL('./likec4-language-server.worker.ts', import.meta.url), {
        name: 'likec4-language-worker',
        type: 'module'
      }))

      const reader = new BrowserMessageReader(worker)
      const writer = new BrowserMessageWriter(worker)

      const languageClient = (languageClientRef.current = new MonacoLanguageClient({
        name: 'LikeC4 Language Client',
        clientOptions: {
          // use a language id as a document selector
          documentSelector: [languageId],
          // disable the default error handler
          errorHandler: {
            error: () => ({ action: ErrorAction.Continue }),
            closed: () => ({ action: CloseAction.DoNotRestart })
          }
        },
        // create a language client connection from the JSON RPC connection on demand
        connectionProvider: {
          get: () => {
            return Promise.resolve({ reader, writer })
          }
        }
      }))

      void languageClient.start().then(
        () => {
          console.info('languageClient.started')
        },
        err => {
          console.error('languageClient.start failed', err)
        }
      )
      return languageClient
    }
    return languageClientRef.current
  }, [])

  return {
    languageClientRef,
    startLanguageClient
  }
}

const loadMonacoModels = (monaco: Monaco, files: Record<string, string>) => {
  for (const [filename, value] of toPairs(files)) {
    const uri = monaco.Uri.parse(filename)
    const model = monaco.editor.getModel(uri)
    if (!model) {
      monaco.editor.createModel(value, languageId, uri)
    } else {
      model.setValue(value)
    }
  }
}

const setup = once((monaco: Monaco) => {
  console.debug('setup monaco')
  // do something before editor is mounted
  monaco.languages.register({
    id: languageId,
    extensions: ['.c4'],
    aliases: ['LikeC4', 'likec4', 'c4'],
    mimetypes: ['text/plain']
  })
  monaco.languages.setLanguageConfiguration(languageId, {
    comments: {
      // symbol used for single line comment. Remove this entry if your language does not support line comments
      lineComment: '//',
      // symbols used for start and end a block comment. Remove this entry if your language does not support block comments
      blockComment: ['/*', '*/']
    },
    // symbols used as brackets
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')']
    ],
    // symbols that are auto closed when typing
    autoClosingPairs: [
      {
        open: '{',
        close: '}'
      },
      {
        open: '[',
        close: ']'
      },
      {
        open: '(',
        close: ')'
      },
      {
        open: "'",
        close: "'",
        notIn: ['string', 'comment']
      },
      {
        open: '"',
        close: '"',
        notIn: ['string']
      },
      {
        open: '`',
        close: '`',
        notIn: ['string', 'comment']
      },
      {
        open: '/*',
        close: ' */',
        notIn: ['string']
      }
    ],
    // symbols that can be used to surround a selection
    surroundingPairs: [
      {
        open: '{',
        close: '}'
      },
      {
        open: '"',
        close: '"'
      },
      {
        open: "'",
        close: "'"
      }
    ],
    colorizedBracketPairs: [['{', '}']],
    indentationRules: {
      increaseIndentPattern: new RegExp('^((?!\\/\\/).)*(\\{[^}"\'`]*|\\([^)"\'`]*|\\[[^\\]"\'`]*)$'),
      decreaseIndentPattern: new RegExp('^((?!.*?\\/\\*).*\\*/)?\\s*[\\)\\}\\]].*$')
    }
  })
  monaco.languages.setMonarchTokensProvider(languageId, likec4Monarch)

  monaco.editor.defineTheme(themeId, {
    base: 'vs-dark',
    inherit: true,
    colors: {
      'editor.background': '#00000000'
    },
    rules: []
  })
})

interface MonacoEditorProps {
  currentFile: string
  initialFiles: Record<string, string>
  onChange: (value: string) => void
}

export default function MonacoEditor({ currentFile, initialFiles, onChange }: MonacoEditorProps) {
  console.log(`Render MonacoEditor`)

  const monacoRef = useRef<Monaco | null>(null)

  const setDiagramFromViewId = useSetAtom(diagramIdAtom)

  const { languageClientRef, startLanguageClient } = useLikeC4LanguageClient()

  const startDataSync = useLikeC4DataSync()

  const editor = monacoRef.current?.editor ?? null

  useEffect(() => {
    if (!editor) {
      return
    }
    const disposable = editor.registerCommand('likec4.open-preview', (_, viewID?: ViewID) => {
      if (viewID) {
        setDiagramFromViewId(viewID)
      }
    })
    return () => {
      disposable.dispose()
    }
  }, [editor])

  useRevealRequestsHandler(monacoRef, languageClientRef)

  useUnmountEffect(() => {
    editor?.getModels().forEach(model => model.dispose())
  })

  return (
    <Editor
      options={{
        'minimap': {
          enabled: false
        },
        'scrollbar': {
          vertical: 'hidden'
        },
        'guides': {
          indentation: false,
          bracketPairs: false,
          bracketPairsHorizontal: 'active'
          // bracketPairs: 'active',
          // highlightActiveIndentation: false
        },
        'lineNumbersMinChars': 4,
        'fontFamily': firaCodeFont.style.fontFamily,
        'fontWeight': '500',
        'fontSize': 14,
        'lineHeight': 20,
        'renderLineHighlightOnlyWhenFocus': true,
        'foldingHighlight': false,
        'overviewRulerBorder': false,
        'overviewRulerLanes': 0,
        'hideCursorInOverviewRuler': true,
        'semanticHighlighting.enabled': true
      }}
      theme={themeId}
      path={currentFile}
      onChange={update => {
        onChange(update ?? '')
      }}
      beforeMount={monaco => {
        monacoRef.current = monaco
        setup(monaco)
        loadMonacoModels(monaco, initialFiles)
        const client = startLanguageClient()
        startDataSync(client)
      }}
      // onMount={(_editor, monaco) => {

      // }}
      // onValidate={markers =>
      //   console.log('onValidate', { markers })
      // }
    />
  )
}
