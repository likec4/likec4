// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { LikeC4ProjectJsonConfig } from '@likec4/config'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { createTestServices } from '@likec4/language-server/test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { type TestAPI, test } from 'vitest'
import { ctx, setLanguageServicesCtx, setMcpServerCtx } from '../ctx'
import { createMCPServer } from '../server/createMCPServer'

export interface MCPTestPair extends AsyncDisposable {
  client: Client
  server: McpServer
  dispose: () => Promise<void>
}

/**
 * Narrow the loosely-typed `structuredContent` from `client.callTool` to a
 * plain `Record<string, unknown>` so tests can index it directly. The MCP SDK
 * returns a union (CallToolResult | CompatibilityCallToolResult) — we accept
 * `unknown` and cast.
 */
export function structured<T = Record<string, unknown>>(result: unknown): T {
  const sc = (result as { structuredContent?: unknown } | null)?.structuredContent
  return (sc ?? {}) as T
}

/**
 * Narrow `client.callTool`'s discriminated `content` array to an array of
 * objects with optional `text`, for assertion convenience in error frames.
 */
export function textContent(result: unknown): Array<{ type: string; text?: string }> {
  const c = (result as { content?: unknown } | null)?.content
  return (c ?? []) as Array<{ type: string; text?: string }>
}

export interface MCPTestPairOptions {
  /** A single DSL document. Mutually exclusive with `docs`. */
  dsl?: string
  /** Optional project configuration for the language-server test workspace. */
  projectConfig?: Partial<LikeC4ProjectJsonConfig>
  /** Multiple DSL documents keyed by file name (e.g. `'spec.c4'`, `'model.c4'`). */
  docs?: Record<string, string>
  /** When true, the helper does not assert validation errors are empty. */
  allowValidationErrors?: boolean
}

/**
 * Wires a real MCP `Client` to a `createMCPServer(...)` instance using a linked
 * pair of in-memory transports — no I/O, no child process, no port.
 *
 * Use this for protocol-level integration tests that exercise the JSON-RPC
 * surface: `client.listTools()`, `client.callTool(...)`, `client.readResource(...)`,
 * `client.getPrompt(...)`, etc.
 *
 * Cleanup order matters: the helper sets `setLanguageServicesCtx` before the
 * server factory runs (because prompts/resources read it at registration time)
 * and unsets context on cleanup.
 */
export async function createMCPTestPair(
  input?: string | MCPTestPairOptions,
): Promise<MCPTestPair> {
  const opts: MCPTestPairOptions = typeof input === 'string' ? { dsl: input } : (input ?? {})

  const testServices = opts.projectConfig
    ? createTestServices({ projectConfig: opts.projectConfig })
    : createTestServices()
  const { addDocument, validate, validateAll, buildLikeC4Model, services } = testServices

  if (opts.dsl) {
    await validate(opts.dsl)
    await buildLikeC4Model()
  } else if (opts.docs) {
    for (const [uri, content] of Object.entries(opts.docs)) {
      await addDocument(content, uri)
    }
    const { errors } = await validateAll()
    if (!opts.allowValidationErrors && errors.length > 0) {
      throw new Error(`Validation errors in test DSL: ${errors.join(', ')}`)
    }
    await buildLikeC4Model()
  }

  const prevCtx = {
    mcpServer: ctx.mcpServer.tryUse() ?? undefined,
    languageServices: ctx.languageServices.tryUse() ?? undefined,
  }

  setLanguageServicesCtx(services.likec4.LanguageServices)
  const server = createMCPServer(services.likec4.LanguageServices)

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  const client = new Client({ name: 'test', version: '0.0.0' }, { capabilities: {} })

  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ])

  let disposed = false
  const dispose = async () => {
    if (disposed) return
    disposed = true
    await Promise.allSettled([
      testServices[Symbol.asyncDispose](),
      client.close(),
      server.close(),
    ])
    // restore previous context
    setMcpServerCtx(prevCtx.mcpServer)
    setLanguageServicesCtx(prevCtx.languageServices)
  }

  return {
    client,
    server,
    dispose,
    [Symbol.asyncDispose]: dispose,
  }
}

export function createMCPTest(
  input?: string | MCPTestPairOptions,
) {
  return test
    // oxlint-disable-next-line no-empty-pattern - required by vitest
    .extend('pair', { scope: 'file' }, async ({}, { onCleanup }) => {
      const pair = await createMCPTestPair(input)
      onCleanup(() => pair.dispose())
      return pair
    })
    .extend('callTool', async ({ pair, task }) => {
      /**
       * @param name - The name of the tool to call
       * @param args - The arguments to pass to the tool
       */
      const callTool = async (name: string, args: Record<string, unknown>) =>
        await pair.client.callTool({ name, arguments: args })

      callTool.structured = async <T = Record<string, unknown>>(name: string, args: Record<string, unknown>) => {
        const result = await pair.client.callTool({ name, arguments: args })
        task.context.expect(result).toHaveProperty('structuredContent')
        return structured<T>(result)
      }

      callTool.text = async (name: string, args: Record<string, unknown>) => {
        const result = await pair.client.callTool({ name, arguments: args })
        return textContent(result)
      }

      return callTool
    })
}
