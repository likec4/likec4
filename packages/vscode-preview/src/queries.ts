import type { ViewId } from '@likec4/core/types'
import { QueryClient, queryOptions } from '@tanstack/react-query'
import { isDeepEqual } from 'remeda'
import { ExtensionApi } from './vscode'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 5, // 5 minutes
      staleTime: 500,
      retry: 2,
      retryDelay: 300,
      networkMode: 'always',
      experimental_prefetchInRender: true,
      structuralSharing(oldData, newData) {
        return isDeepEqual(oldData, newData) ? oldData : newData
      },
    },
  },
})

export const queries = {
  fetchComputedModel: (projectId: string) =>
    queryOptions({
      queryKey: [projectId, 'computed-model'],
      queryFn: async ({ signal }) => {
        const { model } = await ExtensionApi.fetchComputedModel(signal)
        return model
      },
    }),
  fetchDiagramView: (projectId: string, viewId: string) =>
    queryOptions({
      queryKey: [projectId, 'diagram-view', viewId],
      queryFn: async ({ signal }) => {
        const data = await ExtensionApi.fetchDiagramView(viewId as ViewId, signal)
        if (data.error) {
          throw new Error(data.error)
        }
        return data.view
      },
    }),
}
