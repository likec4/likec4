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
  const [isBusy, setIsBusy] = useDebouncedState(false, 300)
  useEffect(() => {
    const subscription = editorActor?.select(s => s.hasTag('busy')).subscribe(isBusy => {
      setIsBusy(isBusy)
    })
    return () => {
      subscription?.unsubscribe()
      setIsBusy(false)
    }
  }, [editorActor, setIsBusy])
  return isBusy
}
