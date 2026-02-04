import { useMemo } from 'react'
import { fromPromise } from 'xstate'
import { useCallbackRef } from '../hooks'
import { applyChangesToManualLayout } from './applyChangesToManualLayout'
import type { EditorCalls } from './editorActor.setup'
import { type EditorActorLogic, editorActorLogic } from './editorActor.states'
import { useOptionalLikeC4Editor } from './LikeC4EditorProvider'

const promisify = <T>(fn: () => T | Promise<T>): Promise<T> => {
  return Promise.resolve().then(() => fn())
}

export function useEditorActorLogic(): EditorActorLogic {
  const port = useOptionalLikeC4Editor()

  const applyLatest: EditorCalls.ApplyLatestToManual = useCallbackRef(
    async ({ input: { viewId, current } }) => {
      if (!port) {
        console.error('No editor port available for applying latest to manual layout')
        return Promise.reject(new Error('No editor port'))
      }
      const manual = await promisify(() => current ?? port.fetchView(viewId, 'manual'))
      const latest = await promisify(() => port.fetchView(viewId, 'auto'))
      const updated = applyChangesToManualLayout(manual, latest)
      return {
        updated,
      }
    },
  )

  const executeChange: EditorCalls.ExecuteChange = useCallbackRef(
    async ({ input }) => {
      if (!port) {
        console.error('No editor port available for executing change')
        return Promise.reject(new Error('No editor port'))
      }
      if (import.meta.env.DEV) {
        console.debug('Executing change', { input })
      }
      for (const change of input.changes) {
        await promisify(() => port.handleChange(input.viewId, change))
      }
      return {}
    },
  )

  return useMemo(() =>
    editorActorLogic.provide({
      actors: {
        applyLatest: fromPromise(applyLatest),
        executeChange: fromPromise(executeChange),
      },
    }), [applyLatest, executeChange])
}
