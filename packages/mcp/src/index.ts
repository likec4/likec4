#!/usr/bin/env node

import { createLanguageServices, LikeC4FileSystem, WithMCPServer } from '@likec4/language-server'
import {
  configureLogger,
  getConsoleStderrSink,
  logger,
} from '@likec4/log'
import { resolve } from 'node:path'
import { URI } from 'vscode-uri'

const LIKEC4_WORKSPACE = URI.file(resolve(process.env['LIKEC4_WORKSPACE'] || '.')).toString()

configureLogger({
  sinks: {
    // Name it as console to override internal logger
    console: getConsoleStderrSink(),
  },
})

process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { err })
})

process.on('unhandledRejection', (err) => {
  logger.error('unhandledRejection', { err })
})

async function main() {
  logger.info`Loading LikeC4 from workspace: ${LIKEC4_WORKSPACE}`

  const langium = await createLanguageServices({
    ...LikeC4FileSystem(true),
    ...WithMCPServer('stdio'),
  })

  await langium.shared.workspace.WorkspaceManager.initializeWorkspace([{
    uri: LIKEC4_WORKSPACE,
    name: 'workspace',
  }])

  await langium.likec4.mcp.Server.start()
}

main().catch(err => {
  logger.error(err)
  process.exit(1)
})
