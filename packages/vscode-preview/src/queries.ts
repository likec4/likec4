import { invariant } from '@likec4/core'
import type { LayoutType, ViewId } from '@likec4/core/types'
import { QueryClient, queryOptions } from '@tanstack/react-query'
import { isDeepEqual } from 'remeda'
import { ExtensionApi, getVscodeState } from './vscode'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: Infinity,
      staleTime: 400,
      retry: 2,
      retryDelay: 300,
      networkMode: 'always',
      experimental_prefetchInRender: true,
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
    initialData: () => getVscodeState().projectsOverview ?? undefined,
  }),
  fetchComputedModel: (projectId: string) =>
    queryOptions({
      queryKey: [projectId, 'model'],
      queryFn: async ({ signal }) => {
        try {
          const response = await ExtensionApi.fetchComputedModel(signal)
          invariant(response, 'Fetch computed model, no response received')
          return response.model
        } catch (e) {
          console.error('Failed to fetch computed model', e)
          return null
        }
      },
    }),
  fetchDiagramView: (projectId: string, viewId: string, layoutType: LayoutType = 'manual') =>
    queryOptions({
      queryKey: [projectId, 'diagram', viewId, layoutType],
      queryFn: async ({ signal }) => {
        const data = await ExtensionApi.fetchDiagramView(viewId as ViewId, layoutType, signal)
        invariant(data, 'Fetch diagram view, no data received')
        if (data.error) {
          throw new Error(data.error)
        }
        return data.view
      },
      structuralSharing(oldData, newData) {
        return isDeepEqual(oldData, newData) ? oldData : newData
      },
    }),
}
