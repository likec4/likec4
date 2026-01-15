import { invariant } from '@likec4/core'
import type { LayoutType, ProjectId, ViewId } from '@likec4/core/types'
import { QueryClient, queryOptions } from '@tanstack/react-query'
import { ExtensionApi } from './vscode'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: Infinity,
      staleTime: 400,
      retry: 2,
      retryDelay: 300,
      networkMode: 'always',
      experimental_prefetchInRender: true,
      throwOnError: false,
    },
  },
})

export const queries = {
  projectsOverview: queryOptions({
    queryKey: ['projects-overview'],
    queryFn: async ({ signal }) => {
      const { projectsView } = await ExtensionApi.fetchProjectsOverview(signal)
      if (!projectsView) {
        throw new Error('Fetch projects overview failed, no response received')
      }
      return projectsView
    },
  }),
  fetchComputedModel: (projectId: ProjectId) =>
    queryOptions({
      queryKey: [projectId, 'model'],
      queryFn: async ({ signal }) => {
        console.log('fetchComputedModel', projectId)
        const response = await ExtensionApi.fetchComputedModel(projectId, signal)
        invariant(response, 'Fetch computed model, no response received')
        if (response.error) {
          throw new Error(response.error)
        }
        if (!response.model) {
          throw new Error(`Project ${projectId} not found`)
        }
        return response.model
      },
    }),
  fetchDiagramView: (projectId: ProjectId, viewId: ViewId, layoutType: LayoutType = 'manual') =>
    queryOptions({
      queryKey: [projectId, 'diagram', viewId, layoutType],
      queryFn: async ({ signal }) => {
        console.log('fetchDiagramView', projectId, viewId, layoutType)
        const data = await ExtensionApi.fetchDiagramView({
          projectId,
          viewId,
          layoutType,
        }, signal)
        invariant(data, 'Fetch diagram view, no data received')
        if (data.error) {
          throw new Error(data.error)
        }
        return data.view
      },
    }),
}
