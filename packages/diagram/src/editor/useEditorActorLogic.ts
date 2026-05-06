import { useMemo } from 'react'
import { isNullish } from 'remeda'
import { fromPromise } from 'xstate'
import { useCallbackRef } from '../hooks'
import { applyChangesToManualLayout } from './applyChangesToManualLayout'
import type { EditorCalls } from './editorActor.setup'
import { type EditorActorLogic, editorActorLogic } from './editorActor.states'
import { useOptionalLikeC4Editor } from './LikeC4EditorProvider'

const promisify = <T>(fn: () => T | Promise<T>): Promise<T> => {
  return Promise.resolve().then(() => fn())
}

export function useEditorActorLogic(): EditorActorLogic & {
  /**
   * True if the editor is running in stub mode (no actual editor port available)
   * This happens when the diagram is rendered outside of vscode extension / vite- plugin
   */
  readonly isStub: boolean
} {
  const port = useOptionalLikeC4Editor()
  const isStub = isNullish(port)

  const applyLatest: EditorCalls.ApplyLatestToManual = useCallbackRef(
    async ({ input: { viewId, current } }) => {
      if (!port) {
        console.error('No editor port available for applying latest to manual layout')
        throw new Error('No editor port')
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
        throw new Error('No editor port')
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

  const applySemanticLayout: EditorCalls.ApplySemanticLayout = useCallbackRef(
    async ({ input }) => {
      if (!port) {
        console.error('No editor port available for applying semantic layout')
        throw new Error('No editor port')
      }
      if (!port.applySemanticLayout) {
        console.error('No applySemanticLayout method available on editor port')
        throw new Error('No applySemanticLayout method')
      }
      if (import.meta.env.DEV) {
        console.debug('Applying semantic layout', { input })
      }
      await port.applySemanticLayout(input.viewId)
      if (import.meta.env.DEV) {
        console.debug('Applied semantic layout', { input })
      }
      return {}
    },
  )

  return useMemo(() =>
    Object.assign(
      editorActorLogic.provide({
        actors: {
          applyLatest: fromPromise(applyLatest),
          executeChange: fromPromise(executeChange),
          applySemanticLayout: fromPromise(applySemanticLayout),
        },
      }),
      { isStub },
    ), [applyLatest, executeChange, applySemanticLayout, isStub])
}
