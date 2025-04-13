import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { LikeC4 } from 'likec4'
import { resolve } from 'node:path'

const LIKEC4_WORKSPACE = resolve(process.env['LIKEC4_WORKSPACE'] || '.')

const likec4 = await LikeC4.fromWorkspace(LIKEC4_WORKSPACE, {
  logger: false,
})

// Create an MCP server
const mcp = new McpServer({
  name: 'Demo',
  version: '1.0.0',
}, {
  capabilities: {
    completions: {},
    tools: {},
    resources: {},
    logging: {},
  },
})

// // Add an addition tool
// mcp.tool('add', { a: z.number(), b: z.number() }, async ({ a, b }) => ({
//   content: [{ type: 'text', text: String(a + b) }],
// }))

// mcp.resource(
//   'likec4 projects',
//   'likec4://projects',
//   {
//     description: 'A list of likec4 projects in the workspace',
//   },
//   async () => ({
//     // contents: [{
//     //   uri: 'likec4://projects',
//     //   mimeType: 'application/json',
//     //   text: JSON.stringify({
//     //     projects: [{
//     //       uri: 'likec4://projects/default',
//     //       name: 'default',
//     //       description: 'Default project',
//     //     }, {
//     //       uri: 'likec4://projects/projectA',
//     //       name: 'projectA',
//     //       description: 'Project A',
//     //     }],
//     //   }),
//     // }],
//     contents: [{
//       uri: 'likec4://projects/default',
//       mimeType: 'application/json',
//       text: JSON.stringify({
//         uri: 'likec4://projects/default',
//         name: 'default',
//         description: 'Default project',
//       }),
//     }, {
//       uri: 'likec4://projects/projectA',
//       mimeType: 'application/json',
//       text: JSON.stringify({
//         uri: 'likec4://projects/projectA',
//         name: 'projectA',
//         description: 'Project A',
//       }),
//     }, {
//       uri: 'likec4://projects/projectB',
//       mimeType: 'application/json',
//       text: JSON.stringify({
//         uri: 'likec4://projects/projectB',
//         name: 'projectB',
//         description: 'Project B',
//       }),
//     }],
//   }),
// )

// Add a dynamic greeting resource
mcp.resource(
  'likec4 project',
  new ResourceTemplate('likec4://projects/{name}', {
    list: async () => {
      const projects = await likec4.languageServices.projects()
      return ({
        resources: projects.map(p => ({
          uri: `likec4://projects/${p.id}`,
          name: p.id,
          description: `likec4 project"${p.id}", folder: "${p.folder.fsPath}"`,
        })),
      })
    },
    complete: {
      name: async (name) => {
        const projects = await likec4.projects()
        return projects.filter(id => id.toLowerCase().startsWith(name.toLowerCase()))
      },
    },
  }),
  {
    description: 'likec4 project in the workspace',
  },
  // list: undefined }),
  async (uri, { name }) => {
    const project = await likec4.languageServices.projects().find(p => p.id === name)
    if (!project) {
      return ({
        contents: [],
      })
    }
    return ({
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(project),
      }],
    })
  },
)

mcp.server.oninitialized = () => {
  // mcp.server.listRoots().then(r => {
  mcp.server.sendLoggingMessage({
    level: 'info',
    data: {
      message: 'Server initialized',
      workspace: likec4.workspace,
    },
  })
  // })
}

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport()
await mcp.connect(transport)
