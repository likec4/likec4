import { ExtractAtomValue, useAtomValue, useSetAtom, useStore } from 'jotai'
import { useRef } from 'react'
import {
  currentFileAtom,
  currentViewAtom,
  editorRevealRequestAtom,
  filesAtom,
  loadableDiagramAtom,
  updateCurrentFileAtom,
  viewsAtom
} from './atoms'
import type { DotLayoutResult } from '@likec4/layouts'

export const useCurrentFile = () => useAtomValue(currentFileAtom)

export const useInitialFiles = () => {
  const store = useStore()
  const files = useRef<Record<string, string>>()
  if (!files.current) {
    files.current = store.get(filesAtom)
  }
  return files.current
}

export const useUpdateCurrentFile = () => useSetAtom(updateCurrentFileAtom)

export const useUpdateViews = () => useSetAtom(viewsAtom)

export const useCurrentView = () => useAtomValue(currentViewAtom)

export const useCurrentDiagramState = () => useAtomValue(loadableDiagramAtom)
export type DiagramState = DotLayoutResult

export const useRevealInEditor = () => useSetAtom(editorRevealRequestAtom)
