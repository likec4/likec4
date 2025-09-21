import type { LikeC4Project, ProjectId } from '@likec4/core/types'
import { useCallbackRef } from '@mantine/hooks'
import { useCustomCompareMemo } from '@react-hookz/web'
import { shallowEqual } from 'fast-equals'
import { type PropsWithChildren, useContext } from 'react'
import { LikeC4ProjectsContext } from './context/LikeC4ProjectsContext'

export interface LikeC4ProjectsProviderProps {
  /**
   * Projects to be used in the navigation panel.
   * Current project is taken from the LikeC4Model
   */
  projects: ReadonlyArray<LikeC4Project>

  /**
   * Optional callback when another project is selected.
   */
  onProjectChange?: (id: ProjectId) => void
}

/**
 * Ensures LikeC4Projects context
 */
export function LikeC4ProjectsProvider({
  children,
  projects,
  onProjectChange: _onProjectChange,
}: PropsWithChildren<LikeC4ProjectsProviderProps>) {
  const outerScope = useContext(LikeC4ProjectsContext)
  if (outerScope) {
    console.warn('LikeC4ProjectsProvider should not be nested inside another one')
  }

  const onProjectChange = useCallbackRef(_onProjectChange)
  const value = useCustomCompareMemo(() => ({ projects, onProjectChange }), [projects, onProjectChange], shallowEqual)
  return (
    <LikeC4ProjectsContext.Provider value={value}>
      {children}
    </LikeC4ProjectsContext.Provider>
  )
}
