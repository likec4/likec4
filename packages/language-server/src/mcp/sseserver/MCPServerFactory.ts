import type { ServerOptions } from '@modelcontextprotocol/sdk/server/index.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import packageJson from '../../../package.json' with { type: 'json' }
import type { LikeC4Services } from '../../module'
import { listProjects } from '../tools/list-projects'
import { openView } from '../tools/open-view'
import { readElement } from '../tools/read-element'
import { readProjectElements } from '../tools/read-project-elements'
import { readProjectSummary } from '../tools/read-project-summary'
import { readView } from '../tools/read-view'
import { searchElement } from '../tools/search-element'
export class LikeC4MCPServerFactory {
  constructor(private services: LikeC4Services) {
  }

  create(options?: ServerOptions): McpServer {
    const isInEditor = this.services.shared.lsp.Connection !== undefined

    const mcp = new McpServer({
      name: 'LikeC4',
      version: packageJson.version,
    }, {
      instructions: `Provides access to LikeC4 model.
Available tools:
- list-projects: List all available LikeC4 projects in the workspace
- read-project-summary: to understand project specifications (what element kinds, tags, metadata keys are available) and available project views
- read-project-elements: list all elements in the project
- search-element: Search for LikeC4 element by partial match of id, title, kind, shape or tags
- read-element: all information about the element (includes source location)
- read-view: all information about the view (includes source location)
${isInEditor ? '- open-view: opens the panel in the editor with the LikeC4 view' : ''}

Documentation for LikeC4 is available at https://likec4.dev/llms-full.txt
`,
      ...options,
      capabilities: {
        tools: {},
        resources: {},
        ...options?.capabilities,
      },
    })
    mcp.registerTool(...listProjects(this.services.likec4.LanguageServices))
    mcp.registerTool(...readProjectSummary(this.services.likec4.LanguageServices))
    mcp.registerTool(...readProjectElements(this.services.likec4.LanguageServices))
    mcp.registerTool(...readElement(this.services.likec4.LanguageServices))
    mcp.registerTool(...readView(this.services.likec4.LanguageServices))
    mcp.registerTool(...searchElement(this.services.likec4.LanguageServices))
    if (isInEditor) {
      mcp.registerTool(...openView(this.services.likec4.LanguageServices))
    }

    return mcp
  }
}
