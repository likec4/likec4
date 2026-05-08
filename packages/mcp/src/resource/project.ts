import { type McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types'
import { prop } from 'remeda'
import { useLanguageServices } from '../ctx'

export function projectResource(
  mcp: McpServer,
): McpServer {
  const services = useLanguageServices()
  mcp.registerResource(
    'likec4-project',
    new ResourceTemplate('likec4://project/{projectId}', {
      list: async () => {
        const projects = services.projects()
        return ({
          resources: projects.map(p => ({
            uri: `likec4://project/${encodeURIComponent(p.id)}`,
            name: p.title,
          })),
        })
      },
      complete: {
        projectId: (value) => {
          if (!value) {
            return services.projects().map(prop('id'))
          }
          const needle = value.toLowerCase()
          return services.projects()
            .filter(p => p.id.toLowerCase().includes(needle))
            .map(prop('id'))
        },
      },
    }),
    {
      description: 'LikeC4 project resource',
      mimeType: 'application/json',
    },
    async (uri: URL, { projectId }) => {
      if (!projectId) {
        return {
          contents: [],
        } satisfies ReadResourceResult
      }
      const ids = typeof projectId === 'string' ? [projectId] : projectId
      const projects = services.projects().filter(p => ids.includes(p.id))

      return ({
        contents: projects.map(p => ({
          uri: `likec4://project/${encodeURIComponent(p.id)}`,
          text: JSON.stringify({
            id: p.id,
            title: p.title,
            folder: p.folder.fsPath,
          }),
        })),
      })
    },
  )
  return mcp
}
