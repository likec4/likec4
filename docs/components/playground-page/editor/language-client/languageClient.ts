import type { Monaco } from '@monaco-editor/react'
import { CloseAction, ErrorAction, MonacoLanguageClient, MonacoServices } from 'monaco-languageclient'
import type { Location } from 'vscode-languageclient/browser';
import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-languageclient/browser'
import { delay } from 'rambdax'
import { onDidChangeLikeC4Model } from '@likec4/language-protocol'

import state from 'state-local'

const [getState, setState] = state.create({
  languageClient: null
})

const getLanguageClient = () => getState().languageClient as MonacoLanguageClient | null

export async function startLanguageClient(_monaco: Monaco) {
  let languageClient = getLanguageClient()
  if (languageClient) {
    return
  }

  const worker = new Worker(new URL('./language-server.worker', import.meta.url))
  const reader = new BrowserMessageReader(worker)
  const writer = new BrowserMessageWriter(worker)

  languageClient = new MonacoLanguageClient({
    name: 'Language Client',
    clientOptions: {
      // use a language id as a document selector
      documentSelector: [{ language: 'likec4' }],
      synchronize: {

      },
      // disable the default error handler
      errorHandler: {
        error: (err, msg, count) => {
          console.error({ err, msg, count })
          return ({ action: ErrorAction.Continue })
        },
        closed: () => ({ action: CloseAction.Restart })
      }
    },
    // create a language client connection to the server running in the web worker
    connectionProvider: {
      get: () => {
        return Promise.resolve({ reader, writer })
      }
    }
  })

  setState({ languageClient })

  await languageClient.start()

  await delay(500)

  // syncModel(languageClient)

  languageClient.onNotification(onDidChangeLikeC4Model, () => {
    console.log('languageClient received onDidChangeLikeC4Model')
  })

  // const docs = monaco.editor.getModels().flatMap(m => m.getLanguageId() === 'c4x' ? [m.uri.toString()] : [])
  // if (docs.length) {
  //   await languageClient.sendRequest(rebuildDocuments, docs)
  // }

}

// async function goToLocation(location: Location) {
//   const model = getMonaco().editor.getModels().find(m => m.uri.toString() === location.uri)
//   const editor = getMonacoEditor()
//   if (!model || !editor) return

//   if (editor.getModel() !== model) {
//     changeCurrentDocument(model.uri.toString())
//     // editor.setModel(model)
//     await delay(100)
//   }

//   const {
//     range: { start, end }
//   } = location

//   const range = {
//     startLineNumber: start.line + 1,
//     startColumn: start.character + 1,
//     endLineNumber: end.line + 1,
//     endColumn: end.character + 1
//   }
//   editor.revealRangeNearTop(range, 0)

//   await delay(100)
//   editor.setSelection(range)
//   // editor.setPosition(position)
//   editor.focus()
// }

// export async function locateElement(element: Fqn) {
//   const languageClient = getLanguageClient()
//   if (!languageClient) {
//     return
//   }
//   const location = await languageClient.sendRequest(locateElementReq, { element })
//   if (!location) return
//   await goToLocation(location)
// }


// export async function locateRelation(id: RelationID) {
//   const languageClient = getLanguageClient()
//   if (!languageClient) {
//     return
//   }
//   const location = await languageClient.sendRequest(locateRelationReq, { id })
//   if (!location) return
//   await goToLocation(location)
// }

// export async function locateView(id: ViewID) {
//   const languageClient = getLanguageClient()
//   if (!languageClient) {
//     return
//   }
//   const location = await languageClient.sendRequest(locateViewReq, { id })
//   if (!location) return
//   await goToLocation(location)
// }
