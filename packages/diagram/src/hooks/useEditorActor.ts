import { useEffect, useState } from 'react'
import type { EditorActorRef } from '../editor/actor/machine'
import type { EditorActorStateTag } from '../editor/actor/types'
import { selectDiagramActor, useDiagramSnapshot } from './useDiagram'

const select = selectDiagramActor(s => {
  return s.children.editor ?? null
})

export function useEditorActorRef(): EditorActorRef | null {
  return useDiagramSnapshot(select, Object.is)
}

export function useEditorActorStateHasTag(tag: EditorActorStateTag) {
  const editorActor = useEditorActorRef()
  const [hasTag, setHasTag] = useState(() => editorActor?.getSnapshot().hasTag(tag) ?? false)
  useEffect(() => {
    const subscription = editorActor?.subscribe((snapshot) => {
      setHasTag(snapshot.hasTag(tag))
    })
    return () => {
      subscription?.unsubscribe()
      setHasTag(false)
    }
  }, [editorActor, tag])
  return hasTag
}
