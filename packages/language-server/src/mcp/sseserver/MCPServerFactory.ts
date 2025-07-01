import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import packageJson from '../../../package.json' with { type: 'json' }
import type { LikeC4Services } from '../../module'
import { listProjects } from '../tools/list-projects'
import { readElement } from '../tools/read-element'
import { readProjectSummary } from '../tools/read-project-summary'
import { readView } from '../tools/read-view'
import { searchElement } from '../tools/search-element'
export class LikeC4MCPServerFactory {
  constructor(private services: LikeC4Services) {
  }

  create(options?: ServerOptions): McpServer {
    const mcp = new McpServer({
      name: 'LikeC4',
      version: packageJson.version,
    }, {
      instructions: `This server provides access to LikeC4 model in the workspace.
Tools:
- List all available LikeC4 projects in the workspace
- Read project summary
- Search for LikeC4 element
- Read element details by id
- Read view details by name
`,
      ...options,
      capabilities: {
        tools: {},
        ...options?.capabilities,
      },
    })
    mcp.registerTool(...listProjects(this.services.likec4.LanguageServices))
    mcp.registerTool(...readProjectSummary(this.services.likec4.LanguageServices))
    mcp.registerTool(...readElement(this.services.likec4.LanguageServices))
    mcp.registerTool(...readView(this.services.likec4.LanguageServices))
    mcp.registerTool(...searchElement(this.services.likec4.LanguageServices))

    return mcp
  }
}
