import type { LayoutType, ProjectId, ViewId } from '@likec4/core/types'
import { keepPreviousData, QueryClient, queryOptions } from '@tanstack/react-query'
import { ExtensionApi } from './vscode'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300,
      retry: 1,
      retryDelay: 300,
      networkMode: 'always',
      throwOnError: false,
      refetchOnWindowFocus: false, // default: true
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
        const response = await ExtensionApi.fetchComputedModel(projectId, signal)
        if (response.model) {
          return response.model
        }
        if (response.error) {
          throw new Error(response.error)
        }
        throw new Error(`Project ${projectId} not found`)
      },
      placeholderData: keepPreviousData,
    }),
  fetchDiagramView: (projectId: ProjectId, viewId: ViewId, layoutType: LayoutType = 'manual', lastHash?: string) =>
    queryOptions({
      queryKey: [projectId, 'diagram', viewId, layoutType, lastHash ?? ''] as const,
      queryFn: async ({ signal }) => {
        const data = await ExtensionApi.fetchDiagramView({
          projectId,
          viewId,
          layoutType,
        }, signal)
        if (data.view) {
          return data.view
        }
        if (data.error) {
          throw new Error(data.error)
        }
        throw new Error('Fetch diagram view failed, no response received')
      },
      refetchInterval: (q) => {
        if (q.isActive() && q.state.status == 'error') {
          return 10000
        }
        return false
      },
    }),
}
