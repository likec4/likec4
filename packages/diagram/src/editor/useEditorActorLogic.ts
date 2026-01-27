import type * as t from '@likec4/core/types'
import { useMemo } from 'react'
import { fromPromise } from 'xstate'
import { useCallbackRef } from '../hooks'
import { applyChangesToManualLayout } from './applyChangesToManualLayout'
import { type EditorActorLogic, type EditorCalls, editorActorLogic } from './editorActor.states'
import { useOptionalLikeC4Editor } from './LikeC4EditorProvider'

export function useEditorActorLogic(viewId: t.ViewId): EditorActorLogic {
  const port = useOptionalLikeC4Editor()

  const applyLatest: EditorCalls.ApplyLatestToManual = useCallbackRef(
    async ({ input: { viewId, current } }) => {
      if (!port) {
        console.error('No editor port available for applying latest to manual layout')
        return Promise.reject(new Error('No editor port'))
      }
      const manual = await Promise.resolve().then(() => current ?? port.fetchView(viewId, 'manual'))
      const latest = await Promise.resolve().then(() => port.fetchView(viewId, 'auto'))
      const updated = applyChangesToManualLayout(manual, latest)
      return {
        updated,
      }
    },
  )

  const executeChange = useCallbackRef(
    async ({ input }: { input: EditorCalls.ExecuteChange.Input }): Promise<EditorCalls.ExecuteChange.Output> => {
      if (!port) {
        console.error('No editor port available for executing change')
        return Promise.reject(new Error('No editor port'))
      }
      for (const change of input.changes) {
        await Promise.resolve().then(() => port.handleChange(viewId, change)).catch(err => {
          console.error('Failed to execute change', {
            change,
            err,
          })
          return Promise.reject(err)
        })
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
