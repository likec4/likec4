import type { ViewId } from '@likec4/core'
import { LikeC4ProjectsOverview } from '@likec4/diagram'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { likec4Container } from '../App.css'
import { queries } from '../queries'
import { ExtensionApi, saveVscodeState } from '../vscode'

export function ProjectsScreen() {
  const { data } = useSuspenseQuery(queries.projectsOverview)

  useEffect(() => {
    saveVscodeState({ projectsOverview: data })
  }, [data])

  return (
    <div className={likec4Container}>
      <LikeC4ProjectsOverview
        view={data}
        onNavigateToProject={projectId => {
          ExtensionApi.navigateTo('index' as ViewId, projectId)
        }}
      />
    </div>
  )
}
