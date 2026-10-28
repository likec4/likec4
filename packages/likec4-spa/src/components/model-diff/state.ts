import type { CompareViewMode } from '@likec4/core/compute-view'
import type { DiffId } from '@likec4/core/types'
import { useStore } from '@nanostores/react'
import { useSearch } from '@tanstack/react-router'
import { atom } from 'nanostores'
import { useModelDiffs } from '../../context/ModelDiffsContext'

/**
 * Selected diff (`null` shows the model as is) and compare mode, kept across views
 */
const $modelDiff = atom<{ diffId: DiffId | null; mode: CompareViewMode }>({
  diffId: null,
  mode: 'changes',
})

/**
 * Selected diff (`null` if the project no longer has it) and compare mode
 */
export function useModelDiffState() {
  const { diffs } = useModelDiffs()
  const { diff } = useSearch({ from: '__root__' })
  const state = useStore($modelDiff)
  const fromUrl = typeof diff === 'string' && diffs.some(d => d.id === diff) ? diff as DiffId : null
  const stored = diffs.some(d => d.id === state.diffId) ? state.diffId : null
  return { diffId: fromUrl ?? stored, mode: state.mode }
}

export function selectDiff(diffId: DiffId | null) {
  $modelDiff.set({ ...$modelDiff.get(), diffId })
}

export function selectCompareMode(mode: CompareViewMode) {
  $modelDiff.set({ ...$modelDiff.get(), mode })
}
