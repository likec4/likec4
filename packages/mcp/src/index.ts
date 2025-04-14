import {
  type ProjectId,
  ifilter,
} from '@likec4/core'
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { Resource } from '@modelcontextprotocol/sdk/types.js'
import { LikeC4 } from 'likec4'
import { resolve } from 'node:path'
import stripIndent from 'strip-indent'
import { z } from 'zod'
import { version } from '../package.json' assert { type: 'json' }
import { listProjects } from './tools/list-projects'
import { readElement } from './tools/read-element'
import { readProject } from './tools/read-project'
import { readView } from './tools/read-view'
import { searchElement } from './tools/search-element'
import { elementResource } from './utils'

const LIKEC4_WORKSPACE = resolve(process.env['LIKEC4_WORKSPACE'] || '.')

const likec4 = await LikeC4.fromWorkspace(LIKEC4_WORKSPACE, {
  logger: false,
})

// Create an MCP server
const mcp = new McpServer({
  name: 'LikeC4',
  version,
}, {
  capabilities: {
    completions: {},
    tools: {},
    resources: {},
    logging: {},
  },
})

mcp.tool(
  'list-projects',
  stripIndent(`
    List all LikeC4 projects in the workspace.
  `),
  async () => {
    const text = await listProjects(likec4.languageServices)
    return {
      content: [{
        type: 'text',
        text,
      }],
    }
  },
)

mcp.tool(
  'read-project-summary',
  stripIndent(`
    Searches for LikeC4 project and returns its summary, specifications, elements and views

    Args:
      project: Project name
  `),
  { project: z.string().optional() },
  async (params) => {
    const text = await readProject(likec4.languageServices, params)
    return {
      content: [{
        type: 'text',
        text,
      }],
    }
  },
)

mcp.tool(
  'search-element',
  stripIndent(`
    Search for LikeC4 elements that have the search string in their names
    Can be used to resolve projects for further requests (like read-element or read-project-summary)

    Args:
      search: non-empty string
  `),
  { search: z.string().min(1) },
  async (params) => {
    const text = await searchElement(likec4.languageServices, params)
    return {
      content: [{
        type: 'text',
        text,
      }],
    }
  },
)

mcp.tool(
  'read-element',
  stripIndent(`
    Read details about LikeC4 element.

    Args:
      id: Element id (FQN)
      project: Project name (optional, will use default project if not specified)
  `),
  {
    project: z.string().optional(),
    id: z.string().min(1),
  },
  async (params) => {
    const text = await readElement(likec4.languageServices, params)
    return {
      content: [{
        type: 'text',
        text,
      }],
    }
  },
)

mcp.tool(
  'read-view',
  stripIndent(`
    Read details about LikeC4 view.

    Args:
      id: View id
      project: Project name (optional, will use default project if not specified)
  `),
  {
    project: z.string().optional(),
    id: z.string(),
  },
  async (params) => {
    const text = await readView(likec4.languageServices, params)
    return {
      content: [{
        type: 'text',
        text,
      }],
    }
  },
)

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
    const model = likec4.computedModel(project as ProjectId)
    const el = model.findElement(id as string)
    if (!el) {
      throw new Error(`Element not found: ${id}`)
    }
    return ({
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(elementResource(likec4.languageServices, el, project as ProjectId)),
      }],
    })
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
await mcp.connect(transport)
