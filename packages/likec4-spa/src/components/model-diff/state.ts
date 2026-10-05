import type { CompareViewMode } from '@likec4/core/compute-view'
import type { DiffId } from '@likec4/core/types'
import { useStore } from '@nanostores/react'
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
  const state = useStore($modelDiff)
  return diffs.some(d => d.id === state.diffId) ? state : { ...state, diffId: null }
}

export function selectDiff(diffId: DiffId | null) {
  $modelDiff.set({ ...$modelDiff.get(), diffId })
}

export function selectCompareMode(mode: CompareViewMode) {
  $modelDiff.set({ ...$modelDiff.get(), mode })
}
