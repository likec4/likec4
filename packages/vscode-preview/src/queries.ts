import type { LayoutType, ProjectId, ViewId } from '@likec4/core/types'
import { keepPreviousData, QueryClient, queryOptions } from '@tanstack/react-query'
import { ExtensionApi } from './vscode'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 200,
      gcTime: 5 * 60_000,
      retry: 2,
      retryDelay: 200,
      networkMode: 'always',
      throwOnError: false,
      refetchOnMount: 'always',
      refetchOnWindowFocus: false,
      refetchInterval: (q) => {
        if (q.state.status == 'error' && q.state.errorUpdateCount <= 10) {
          return 1000 + q.state.errorUpdateCount * 2000
        }
        return false
      },
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
    placeholderData: keepPreviousData,
  }),
  fetchComputedModel: (projectId: ProjectId) =>
    queryOptions({
      queryKey: ['project', projectId, 'model'],
      queryFn: async ({ signal }) => {
        const response = await ExtensionApi.fetchComputedModel(projectId, signal)
        if (response.model) {
          return response.model
        }
        if (response.error) {
          throw response.error
        }
        throw new Error(`Project ${projectId} not found`)
      },
      placeholderData: keepPreviousData,
    }),
  fetchDiagramView: (
    projectId: ProjectId,
    viewId: ViewId,
    layoutType: LayoutType = 'manual',
    lastHash?: string,
  ) =>
    queryOptions({
      queryKey: ['project', projectId, 'diagram', viewId, layoutType, lastHash] as const,
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
          throw data.error
        }
        throw new Error('Fetch diagram view failed, no response received')
      },
      placeholderData: keepPreviousData,
    }),
}
