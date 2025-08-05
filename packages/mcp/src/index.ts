#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { LikeC4 } from 'likec4'
import { resolve } from 'node:path'

const LIKEC4_WORKSPACE = resolve(process.env['LIKEC4_WORKSPACE'] || '.')

async function main() {
  console.error(`Loading LikeC4 from workspace ${LIKEC4_WORKSPACE}`)
  const likec4 = await LikeC4.fromWorkspace(LIKEC4_WORKSPACE, {
    logger: false,
  })

  const mcp = likec4.langium.mcp.ServerFactory.create({
    capabilities: {
      tools: {},
      logging: {},
    },
  })
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
