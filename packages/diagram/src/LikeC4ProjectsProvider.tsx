import type { LikeC4Project, ProjectId } from '@likec4/core/types'
import { deepEqual } from 'fast-equals'
import { type PropsWithChildren, useEffect, useState } from 'react'
import type { JSX } from 'react/jsx-runtime'
import { LikeC4ProjectsContextProvider, useOptionalProjectsContext } from './context/LikeC4ProjectsContext'
import { useCallbackRef } from './hooks/useCallbackRef'

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
}: PropsWithChildren<LikeC4ProjectsProviderProps>): JSX.Element {
  const outerScope = useOptionalProjectsContext()

  useEffect(() => {
    if (outerScope) {
      console.warn('LikeC4ProjectsProvider should not be nested inside another one')
    }
  })

  const onProjectChange = useCallbackRef(_onProjectChange)

  const [value, setValue] = useState(() => ({ projects, onProjectChange }))

  useEffect(() => {
    setValue(current => {
      return deepEqual(current.projects, projects) ? current : { ...current, projects }
    })
  }, [projects])

  return (
    <LikeC4ProjectsContextProvider value={value}>
      {children}
    </LikeC4ProjectsContextProvider>
  )
}
