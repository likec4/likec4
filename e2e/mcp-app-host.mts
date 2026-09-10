// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { existsSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { type ServerResponse, createServer } from 'node:http'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const MODEL = `specification {
  element component
}

model {
  api = component 'API'
  worker = component 'Worker'
  unused = component 'Unused'
  api -> worker 'calls'
}

views {
  view index {
    include api
    include worker
  }
}
`

const BROWSER_ENTRY = `
import { AppBridge, PostMessageTransport } from '@modelcontextprotocol/ext-apps/app-bridge'

const iframe = document.querySelector('iframe')!
const { toolArguments, toolResult } = globalThis.__MCP_APP_CASE__
const client = null
const bridge = new AppBridge(
  client,
  { name: 'likec4-mcp-app-e2e', version: '1.0.0' },
  { serverTools: {}, logging: {} },
)
bridge.oninitialized = () => {
  bridge.sendToolInput({ arguments: toolArguments })
  bridge.sendToolResult(toolResult)
}
await bridge.connect(new PostMessageTransport(iframe.contentWindow!, iframe.contentWindow!))
iframe.src = iframe.dataset.src!
`

type Mode = 'scoped' | 'full'

interface RenderCase {
  toolArguments: {
    viewId: string
    fullModel?: boolean
  }
  toolResult: Record<string, unknown>
  metadata: {
    nodeCount: number
    edgeCount: number
    hasUnusedElement: boolean
  }
}

function send(response: ServerResponse, status: number, contentType: string, body: string): void {
  response.writeHead(status, {
    'content-type': contentType,
    'content-length': Buffer.byteLength(body),
  })
  response.end(body)
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} is not an object`)
  }
  return value as Record<string, unknown>
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} is not an array`)
  }
  return value
}

function createRenderCase(
  toolArguments: RenderCase['toolArguments'],
  result: unknown,
): RenderCase {
  const toolResult = asRecord(result, 'render-view result')
  if (toolResult['isError']) {
    throw new Error(`render-view returned isError for ${JSON.stringify(toolArguments)}`)
  }

  const structuredContent = asRecord(toolResult['structuredContent'], 'render-view structuredContent')
  const view = asRecord(structuredContent['view'], 'render-view view')
  const model = asRecord(structuredContent['model'], 'render-view model')
  const elements = asRecord(model['elements'], 'render-view model.elements')

  return {
    toolArguments,
    toolResult,
    metadata: {
      nodeCount: asArray(view['nodes'], 'render-view view.nodes').length,
      edgeCount: asArray(view['edges'], 'render-view view.edges').length,
      hasUnusedElement: Object.hasOwn(elements, 'unused'),
    },
  }
}

function serializeForScript(value: unknown): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}

function hostPage(mode: Mode, renderCase: RenderCase): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LikeC4 MCP App E2E — ${mode}</title>
  <style>
    html, body { margin: 0; padding: 0; }
    .iframe-container { width: 1280px; height: 720px; }
    iframe { display: block; width: 100%; height: 100%; border: 0; }
  </style>
</head>
<body>
  <div class="iframe-container">
    <iframe title="LikeC4 render-view" data-src="/case/${mode}/resource"></iframe>
  </div>
  <script>globalThis.__MCP_APP_CASE__ = ${
    serializeForScript({
      toolArguments: renderCase.toolArguments,
      toolResult: renderCase.toolResult,
    })
  }</script>
  <script type="module" src="/bridge.js"></script>
</body>
</html>`
}

const portText = process.env['MCP_APP_TEST_PORT'] ?? '5176'
const port = Number.parseInt(portText, 10)
if (!Number.isSafeInteger(port) || port < 1 || port > 65_535 || String(port) !== portText) {
  throw new Error(`Invalid MCP_APP_TEST_PORT: ${portText}`)
}

const require = createRequire(import.meta.url)
const e2eRoot = dirname(fileURLToPath(import.meta.url))
const mcpPackageRoot = dirname(require.resolve('@likec4/mcp/package.json'))
const mcpBin = resolve(mcpPackageRoot, 'bin/likec4-mcp.mjs')
if (!existsSync(mcpBin)) {
  throw new Error(`Installed @likec4/mcp binary does not exist: ${mcpBin}`)
}

const mcpRequire = createRequire(resolve(mcpPackageRoot, 'package.json'))
const [{ Client }, { StdioClientTransport }, { build }] = await Promise.all([
  import(pathToFileURL(mcpRequire.resolve('@modelcontextprotocol/sdk/client/index.js')).href),
  import(pathToFileURL(mcpRequire.resolve('@modelcontextprotocol/sdk/client/stdio.js')).href),
  import(pathToFileURL(mcpRequire.resolve('esbuild')).href),
])

const workspace = await mkdtemp(join(tmpdir(), 'likec4-mcp-app-e2e-'))
await Promise.all([
  writeFile(join(workspace, 'likec4.config.json'), JSON.stringify({ name: 'mcp-app-e2e' })),
  writeFile(join(workspace, 'model.c4'), MODEL),
])

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [mcpBin, '--stdio', '--no-watch', workspace],
})
const client = new Client({ name: 'likec4-mcp-app-e2e', version: '1.0.0' }, { capabilities: {} })

let server: ReturnType<typeof createServer> | undefined
let closing = false
async function close(): Promise<void> {
  if (closing) return
  closing = true
  await Promise.allSettled([
    client.close(),
    server
      ? new Promise<void>((done) => server!.close(() => done()))
      : Promise.resolve(),
  ])
  await rm(workspace, { recursive: true, force: true })
}

try {
  await client.connect(transport)

  const [scopedResult, fullResult, resource, browserBuild] = await Promise.all([
    client.callTool({ name: 'render-view', arguments: { viewId: 'index' } }),
    client.callTool({ name: 'render-view', arguments: { viewId: 'index', fullModel: true } }),
    client.readResource({ uri: 'ui://likec4/render-view.html' }),
    build({
      absWorkingDir: e2eRoot,
      bundle: true,
      format: 'esm',
      platform: 'browser',
      stdin: {
        contents: BROWSER_ENTRY,
        loader: 'ts',
        resolveDir: e2eRoot,
        sourcefile: 'mcp-app-bridge.ts',
      },
      write: false,
    }),
  ])

  const cases: Record<Mode, RenderCase> = {
    scoped: createRenderCase({ viewId: 'index' }, scopedResult),
    full: createRenderCase({ viewId: 'index', fullModel: true }, fullResult),
  }
  if (cases.scoped.metadata.hasUnusedElement || !cases.full.metadata.hasUnusedElement) {
    throw new Error('render-view model scoping does not match the expected contract')
  }

  const resourceText = resource.contents[0]?.text
  if (typeof resourceText !== 'string') {
    throw new Error('ui://likec4/render-view.html did not return text content')
  }
  const bridgeScript = browserBuild.outputFiles[0]?.text
  if (!bridgeScript) {
    throw new Error('esbuild did not produce the AppBridge browser bundle')
  }

  server = createServer((request, response) => {
    if (request.method !== 'GET') {
      send(response, 405, 'text/plain; charset=utf-8', 'Method Not Allowed')
      return
    }

    const pathname = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`).pathname
    const pageMatch = /^\/case\/(scoped|full)$/.exec(pathname)
    const metadataMatch = /^\/case\/(scoped|full)\/metadata$/.exec(pathname)
    const resourceMatch = /^\/case\/(scoped|full)\/resource$/.exec(pathname)

    if (pageMatch) {
      const mode = pageMatch[1] as Mode
      send(response, 200, 'text/html; charset=utf-8', hostPage(mode, cases[mode]))
      return
    }
    if (metadataMatch) {
      const mode = metadataMatch[1] as Mode
      send(response, 200, 'application/json; charset=utf-8', JSON.stringify(cases[mode].metadata))
      return
    }
    if (resourceMatch) {
      send(response, 200, 'text/html; charset=utf-8', resourceText)
      return
    }
    if (pathname === '/bridge.js') {
      send(response, 200, 'text/javascript; charset=utf-8', bridgeScript)
      return
    }
    if (pathname === '/favicon.ico') {
      response.writeHead(204)
      response.end()
      return
    }
    send(response, 404, 'text/plain; charset=utf-8', 'Not Found')
  })

  await new Promise<void>((done, reject) => {
    server!.once('error', reject)
    server!.listen(port, '127.0.0.1', done)
  })
  console.log(`LikeC4 MCP App E2E host listening on http://127.0.0.1:${port}`)
} catch (error) {
  await close()
  throw error
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void close().finally(() => process.exit(0))
  })
}
