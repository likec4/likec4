/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* --------------------------------------------------------------------------------------------
 * Copyright (c) 2018-2022 TypeFox GmbH (http://www.typefox.io). All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { Rpc } from '@likec4/language-server/protocol'
import { loader, useMonaco, type Monaco } from "@monaco-editor/react"
import * as monaco from 'monaco-editor'
import { MonacoLanguageClient, MonacoServices } from 'monaco-languageclient'
import { BrowserMessageReader, BrowserMessageWriter, CloseAction, ErrorAction } from 'vscode-languageclient/browser'

import { once, toPairs } from 'rambdax'
import { StandaloneServices } from 'vscode/services'

import { Editor } from "@monaco-editor/react"
import getModelEditorServiceOverride from 'vscode/service-override/modelEditor'
// import getNotificationServiceOverride from 'vscode/service-override/notifications'
// import getDialogServiceOverride from 'vscode/service-override/dialogs'
import likec4Monarch from './likec4.monarch'
import styles from './monaco.module.css'
import { Fira_Code } from 'next/font/google'
import { useEffect, useRef } from 'react'
import type { ViewID, ComputedView } from '@likec4/core/types'
import { useLikeC4DataSyncEffect } from './likec4-data-sync'
import { setDiagramFromViewId } from '../data'

self.MonacoEnvironment = {
  getWorker(_, _label) {
    // if (label === 'json') {
    //   return new Worker(new URL('monaco-editor/esm/vs/language/json/json.worker', import.meta.url))
    // }
    // if (label === 'typescript' || label === 'javascript') {
    //   return new Worker(new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url))
    // }
    return new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url))
  }
}

const firaCodeFont = Fira_Code({
  preload: true,
  weight: ['400', '500'],
  subsets: ['latin']
})

loader.config({ monaco })

StandaloneServices.initialize({
  // ...getNotificationServiceOverride(document.body),
  // ...getDialogServiceOverride(document.body),
  ...getModelEditorServiceOverride((_model, _options, _sideBySide) => {
    // const editor = getMonacoEditor()
    // if (!editor) {
    //   console.warn('no active editor')
    //   return Promise.resolve(undefined)
    // }
    // // const editorModel = editor.getModel() ?? null
    // // if (!editorModel || editorModel.uri.toString() !== model.uri.toString()) {
    // //   changeCurrentDocument(model.uri.toString())
    // // }
    return Promise.resolve(undefined)
  })
})

export const languageId = 'likec4'
const themeId = 'likec4PlaygroundTheme'

let languageClient: MonacoLanguageClient | null = null

function startLanguageClient() {
  if (!languageClient) {
    console.debug('create likec4 language client')
    const worker = new Worker(new URL('./likec4-language-server.worker', import.meta.url), {
      name: 'likec4-language-worker'
    })

    window?.addEventListener('beforeunload', () => {
      worker.terminate()
    })

    const reader = new BrowserMessageReader(worker)
    const writer = new BrowserMessageWriter(worker)

    languageClient = new MonacoLanguageClient({
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
    })
  }

  if (languageClient.needsStart()) {
    languageClient.start().then(
      () => {
        console.info('languageClient.started')
      },
      err => {
        console.error('languageClient.start', err)
      },
    )
  }


  return languageClient
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
    mimetypes: ['text/plain'],
  })
  monaco.languages.setLanguageConfiguration(languageId, {
    "comments": {
      // symbol used for single line comment. Remove this entry if your language does not support line comments
      "lineComment": "//",
      // symbols used for start and end a block comment. Remove this entry if your language does not support block comments
      "blockComment": ["/*", "*/"]
    },
    // symbols used as brackets
    "brackets": [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"]
    ],
    // symbols that are auto closed when typing
    "autoClosingPairs": [
      {
        "open": "{",
        "close": "}"
      },
      {
        "open": "[",
        "close": "]"
      },
      {
        "open": "(",
        "close": ")"
      },
      {
        "open": "'",
        "close": "'",
        "notIn": ["string", "comment"]
      },
      {
        "open": "\"",
        "close": "\"",
        "notIn": ["string"]
      },
      {
        "open": "`",
        "close": "`",
        "notIn": ["string", "comment"]
      },
      {
        "open": "/*",
        "close": " */",
        "notIn": ["string"]
      }
    ],
    // symbols that can be used to surround a selection
    "surroundingPairs": [
      {
        open: '{',
        close: '}'
      },
      {
        open: '"',
        close: '"'
      },
      {
        open: '\'',
        close: '\''
      },
    ],
    "colorizedBracketPairs": [["{", "}"]],
    "indentationRules": {
      "increaseIndentPattern": new RegExp("^((?!\\/\\/).)*(\\{[^}\"'`]*|\\([^)\"'`]*|\\[[^\\]\"'`]*)$"),
      "decreaseIndentPattern": new RegExp("^((?!.*?\\/\\*).*\\*/)?\\s*[\\)\\}\\]].*$")
    }
  })
  monaco.languages.setMonarchTokensProvider(languageId, likec4Monarch)

  monaco.editor.defineTheme(themeId, {
    base: 'vs-dark',
    inherit: true,
    colors: {
      'editor.background': '#00000000',
    },
    rules: []
  })

  MonacoServices.install()
})

interface MonacoEditorProps {
  currentFile: string
  initiateFiles: () => Record<string, string>
  onChange: (value: string) => void
  // /onSwitchView: (viewId: ViewID) => void
  // onChangeViews: (views: Record<ViewID, ComputedView>) => void
}

export default function MonacoEditor({
  currentFile,
  initiateFiles,
  onChange,
  // onSwitchView,
  // onChangeViews
}: MonacoEditorProps) {

  const monacoRef = useRef<Monaco | null>(null)

  useLikeC4DataSyncEffect(startLanguageClient)

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

  // useEffect(() => {
  //   const languageClient = startLanguageClient()
  //   let seqId = 1

  //   async function fetchModel() {
  //     const id = seqId++
  //     const tag = `syncLikeC4Data.fetchModel.${id}`
  //     console.time(tag)
  //     try {
  //       const { model } = await languageClient.sendRequest(Rpc.fetchModel)
  //       if (!model) {
  //         console.warn(`${tag}: empty model`)
  //         return
  //       }
  //       onChangeViews(model.views)
  //     } catch (error) {
  //       console.error(`${id}: error`, error)
  //     } finally {
  //       console.timeEnd(tag)
  //     }
  //   }

  //   const onDidChangeModel = languageClient.onNotification(Rpc.onDidChangeModel, () => {
  //     console.debug('syncLikeC4Data: onDidChangeModel')
  //     void fetchModel()
  //   })
  //   console.debug('syncLikeC4Data: on')

  //   return () => {
  //     onDidChangeModel.dispose()
  //     console.debug('syncLikeC4Data: off')
  //   }
  // }, [])

  return <Editor
    options={{
      extraEditorClassName: styles.likec4editor + ' likec4-editor',
      minimap: {
        enabled: false
      },
      scrollbar: {
        vertical: 'hidden',
      },
      guides: {
        indentation: false,
        bracketPairs: false,
        bracketPairsHorizontal: 'active'
        // bracketPairs: 'active',

        // highlightActiveIndentation: false
      },
      fontFamily: firaCodeFont.style.fontFamily,
      fontWeight: '500',
      fontSize: 14,
      lineHeight: 22,
      renderLineHighlightOnlyWhenFocus: true,
      foldingHighlight: false,
      overviewRulerBorder: false,
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      'semanticHighlighting.enabled': true,
    }}
    theme={themeId}
    path={currentFile}
    onChange={update => {
      onChange(update ?? '')
    }}
    keepCurrentModel
    beforeMount={monaco => {
      monacoRef.current = monaco
      setup(monaco)
      loadMonacoModels(monaco, initiateFiles())
      void startLanguageClient()
    }}
    // onMount={(_editor, monaco) => {

    // }}
  // onValidate={markers =>
  //   console.log('onValidate', { markers })
  // }
  />
}
