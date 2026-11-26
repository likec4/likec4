import { useDebouncedState } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import type { EditorActorRef } from '../editor/actor/machine'
import type { EditorActorStateTag } from '../editor/actor/types'
import { selectDiagramSnapshot, useDiagramSelector } from './useDiagram'

const select = selectDiagramSnapshot(
  s => s.children.editor ?? null,
  Object.is,
)

export function useEditorActorRef(): EditorActorRef | null {
  return useDiagramSelector(select)
}

export function useEditorActorStateHasTag(tag: EditorActorStateTag) {
  const editorActor = useEditorActorRef()
  const [hasTag, setHasTag] = useState(() => editorActor?.getSnapshot().hasTag(tag) ?? false)
  useEffect(() => {
    const subscription = editorActor?.select(s => s.hasTag(tag)).subscribe(hasTag => {
      setHasTag(hasTag)
    })
    return () => {
      subscription?.unsubscribe()
      setHasTag(false)
    }
  }, [editorActor, tag])
  return hasTag
}

/**
 * Check if the editor actor is in the 'busy' state
 * (i.e. syncing with the backend)
 */
export function useEditorIsBusy() {
  const editorActor = useEditorActorRef()
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    let timeout: number | null = null
    let lastValue: boolean | null = null

    const throttleUpdate = (next: boolean) => {
      lastValue = next
      timeout ??= window.setTimeout(() => {
        setIsBusy(lastValue ?? false)
        timeout = null
      }, 250)
    }

    const subscription = editorActor?.select(s => s.hasTag('busy')).subscribe(isBusy => {
      // First emit - set the initial value immediately, don't debounce
      if (lastValue === null) {
        setIsBusy(lastValue = isBusy)
        return
      }
      throttleUpdate(isBusy)
    })
    return () => {
      subscription?.unsubscribe()
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      setIsBusy(false)
    }
  }, [editorActor, setIsBusy])
  return isBusy
}
