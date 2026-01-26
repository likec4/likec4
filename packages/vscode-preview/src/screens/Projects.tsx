import type { ViewId } from '@likec4/core'
import { LikeC4ProjectsOverview } from '@likec4/diagram'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { likec4Container } from '../App.css'
import { queries } from '../queries'
import { ErrorMessage } from '../QueryErrorBoundary'
import { ExtensionApi, saveVscodeState } from '../vscode'

export function ProjectsScreen() {
  const { data, error, refetch } = useQuery(queries.projectsOverview)

  useEffect(() => {
    if (!data) {
      return
    }
    saveVscodeState({ projectsOverview: data })
  }, [data])

  useEffect(() => {
    ExtensionApi.updateTitle('Projects Overview')
  }, [])

  return (
    <div className={likec4Container}>
      {error && <ErrorMessage error={error} onReset={refetch} />}
      {data && (
        <LikeC4ProjectsOverview
          view={data}
          onNavigateToProject={projectId => {
            ExtensionApi.navigateTo('index' as ViewId, projectId)
          }}
        />
      )}
    </div>
  )
}
