import { type Monaco } from "@monaco-editor/react"
import type { MonacoLanguageClient } from 'monaco-languageclient'
import { delay, equals, isNil } from 'rambdax'
import type { Location } from 'vscode-languageclient'
import { switchToFile, useEditorState } from '../data'
import { type EditorRevealRequest } from '../data/editor-state'
import type { RefObject} from 'react';
import { useEffect } from 'react'
import { Rpc } from './protocol'

function listenRevealRequests(monacoRef: RefObject<Monaco>, languageClient: MonacoLanguageClient) {

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

  async function requestLocation(revealRequest: EditorRevealRequest) {
    if ('element' in revealRequest) {
      return await languageClient.sendRequest(Rpc.locateElement, { element: revealRequest.element })
    }
    if ('view' in revealRequest) {
      return await languageClient.sendRequest(Rpc.locateView, { id: revealRequest.view })
    }
    if ('relation' in revealRequest) {
      return await languageClient.sendRequest(Rpc.locateRelation, { id: revealRequest.relation })
    }
    throw new Error('Unknown reveal request')
  }

  async function process(revealRequest: EditorRevealRequest) {
    const location = await requestLocation(revealRequest)
    if (location) {
      await goToLocation(location)
    }
  }

  let previousRequest: unknown | null = null
  return useEditorState.subscribe(({revealRequest}) => {
    if (isNil(revealRequest) || equals(revealRequest, previousRequest)) {
      previousRequest = revealRequest
      return
    }
    previousRequest = revealRequest
    process(revealRequest).catch(e => {
      console.error('revealRequest error', e)
    })
  })
}

export const useRevealRequestsHandler = (
  monacoRef: RefObject<Monaco>,
  languageClient: () => MonacoLanguageClient
) => {
  useEffect(() => listenRevealRequests(monacoRef, languageClient()), [])
}
