#!/usr/bin/env node

import {
  type ProjectId,
  ifilter,
} from '@likec4/core'
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { Resource } from '@modelcontextprotocol/sdk/types.js'
import { LikeC4 } from 'likec4'
import { resolve } from 'node:path'

const LIKEC4_WORKSPACE = resolve(process.env['LIKEC4_WORKSPACE'] || '.')

async function main() {
  console.error(`Loading LikeC4 from workspace ${LIKEC4_WORKSPACE}`)
  const likec4 = await LikeC4.fromWorkspace(LIKEC4_WORKSPACE, {
    logger: false,
  })

  const mcpTools = likec4.langium.mcp.Tools
  const mcp = likec4.langium.mcp.ServerFactory.create({
    capabilities: {
      completions: {},
      tools: {},
      resources: {},
    },
  })

  mcp.resource(
    'likec4 element',
    new ResourceTemplate('likec4://projects/{project}/elements/{id}', {
      list: async () => {
        const projects = await likec4.languageServices.projects()
        const resources: Resource[] = []
        for (const { id } of projects) {
          const model = likec4.computedModel(id)
          for (const el of model.elements()) {
            resources.push({
              uri: `likec4://projects/${id}/elements/${el.id}`,
              name: el.title,
              id: el.id,
              description: `Model element of kind "${el.kind}"`,
            })
          }
        }
        return ({
          resources,
        })
      },
      complete: {
        project: async (name) => {
          const projects = await likec4.projects()
          const newLocal = name.toLowerCase()
          return projects.filter(id => id.toLowerCase().startsWith(newLocal))
        },
        id: async (name) => {
          const { id } = likec4.languageServices.projects()[0]
          const model = likec4.computedModel(id)
          return [...ifilter(model.elements(), el => el.id.startsWith(name))].map(i => i.id)
        },
      },
    }),
    async (uri, { project, id }) => {
      const text = await mcpTools.readElement({
        id: id as string,
        project: project as ProjectId,
      })
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text,
        }],
      }
    },
  )

  mcp.server.oninitialized = () => {
    mcp.server.sendLoggingMessage({
      level: 'info',
      data: {
        message: 'Server initialized',
        workspace: likec4.workspace,
      },
    })
  }

  const transport = new StdioServerTransport()
  console.error('Connecting server to transport...')
  await mcp.connect(transport)
  console.error('LikeC4 MCP Server running on stdio')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
