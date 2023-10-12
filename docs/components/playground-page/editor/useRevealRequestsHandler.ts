import { type Monaco } from '@monaco-editor/react'
import { useStore } from 'jotai'
import type { MonacoLanguageClient } from 'monaco-languageclient'
import { delay, isNil } from 'rambdax'
import type { RefObject } from 'react'
import { useEffect } from 'react'
import type { Location } from 'vscode-languageclient'
import { currentFileAtom, editorRevealRequestAtom } from '../data'
import { type EditorRevealRequest } from '../data'
import { Rpc } from './protocol'

function processRevealRequests(
  switchToFile: (uri: string) => void,
  monacoRef: RefObject<Monaco>,
  languageClientRef: RefObject<MonacoLanguageClient>
) {
  async function goToLocation(location: Location) {
    const monaco = monacoRef.current
    if (!monaco) return

    const model = monaco.editor.getModels().find(m => m.uri.toString() === location.uri)
    const editor = monaco.editor.getEditors()[0]
    if (!model || !editor) return

    if (editor.getModel() !== model) {
      switchToFile(model.uri.toString())
      await delay(100)
    }

    const {
      range: { start, end }
    } = location

    const range = {
      startLineNumber: start.line + 1,
      startColumn: start.character + 1,
      endLineNumber: end.line + 1,
      endColumn: end.character + 1
    }
    editor.revealLineNearTop(range.startLineNumber, 0)
    await delay(100)
    editor.setSelection(range)
    editor.focus()
  }

  async function requestLocation(
    languageClient: MonacoLanguageClient,
    revealRequest: EditorRevealRequest
  ) {
    return await languageClient.sendRequest(Rpc.locate, revealRequest)
  }

  return async (revealRequest: EditorRevealRequest) => {
    const languageClient = languageClientRef.current
    if (!languageClient) return
    const location = await requestLocation(languageClient, revealRequest)
    if (location) {
      await goToLocation(location)
    }
  }

  // let previousRequest: unknown | null = null
  // return useEditorState.subscribe(({revealRequest}) => {
  //   if (isNil(revealRequest) || Object.is(revealRequest, previousRequest)) {
  //     previousRequest = revealRequest
  //     return
  //   }
  //   previousRequest = revealRequest
  //   process(revealRequest).catch(e => {
  //     console.error('revealRequest error', e)
  //   })
  // })
}

export const useRevealRequestsHandler = (
  monacoRef: RefObject<Monaco>,
  languageClientRef: RefObject<MonacoLanguageClient>
) => {
  const store = useStore()
  useEffect(() => {
    const process = processRevealRequests(
      (uri: string) => store.set(currentFileAtom, uri),
      monacoRef,
      languageClientRef
    )
    let previousRequest: EditorRevealRequest | null = null
    return store.sub(editorRevealRequestAtom, () => {
      const revealRequest = store.get(editorRevealRequestAtom)
      if (isNil(revealRequest) || Object.is(revealRequest, previousRequest)) {
        previousRequest = revealRequest
        return
      }
      previousRequest = revealRequest
      process(revealRequest).catch(e => {
        console.error('revealRequest error', e)
      })
    })
  }, [])
}
