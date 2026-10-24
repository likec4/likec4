import { useStore } from '@nanostores/react'
import type { ProjectDiffs } from 'likec4:diffs'
import { type ReadableAtom, atom } from 'nanostores'
import { type PropsWithChildren, createContext, useContext } from 'react'

const ModelDiffsCtx = createContext<ReadableAtom<ProjectDiffs>>(atom({ diffs: [], views: {} }))

/**
 * Provides the diffs of the project with their compare views
 */
export function ModelDiffsContext({ diffs, children }: PropsWithChildren<{ diffs: ReadableAtom<ProjectDiffs> }>) {
  return <ModelDiffsCtx.Provider value={diffs}>{children}</ModelDiffsCtx.Provider>
}

export const useModelDiffs = (): ProjectDiffs => useStore(useContext(ModelDiffsCtx))
