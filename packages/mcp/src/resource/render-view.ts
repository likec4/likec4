import { registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { readRenderViewClientBundle, readRenderViewClientStyles } from '../appAssets'
import { renderViewResourceUri } from '../tools/render-view'

function renderHtml(clientScript: string, clientStyles: string): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>${clientStyles}</style>
<style>
  html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
  #root { width: 100%; height: 100%; }
</style>
</head>
<body>
  <div id="root"></div>
  <script>${clientScript}</script>
</body>
</html>`
}

export function renderViewResource(mcpServer: McpServer): McpServer {
  registerAppResource(
    mcpServer,
    'Render View UI',
    renderViewResourceUri,
    {
      description: 'Interactive diagram UI for the render-view MCP App tool.',
    },
    async () => ({
      contents: [{
        uri: renderViewResourceUri,
        mimeType: RESOURCE_MIME_TYPE,
        text: renderHtml(readRenderViewClientBundle(), readRenderViewClientStyles()),
      }],
    }),
  )
  return mcpServer
}
