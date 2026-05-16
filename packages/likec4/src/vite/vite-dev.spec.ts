import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock get-port so tests never touch the network/OS
vi.mock('get-port', async (importOriginal) => {
  const actual = await importOriginal<typeof import('get-port')>()
  return {
    ...actual,
    default: vi.fn().mockResolvedValue(24678),
  }
})

// Mock std-env so we can control env vars without touching process.env
vi.mock('std-env', () => ({
  env: {} as Record<string, string | undefined>,
  isDevelopment: false,
}))

// Mock the heavy Vite/language-server transitive imports so this test stays unit-level
vi.mock('./config-app', () => ({ viteConfig: vi.fn() }))
vi.mock('./config-webcomponent', () => ({ viteWebcomponentConfig: vi.fn() }))
vi.mock('./utils', () => ({ mkTempPublicDir: vi.fn().mockResolvedValue('/tmp/pub') }))
vi.mock('vite', () => ({ createServer: vi.fn(), build: vi.fn() }))
vi.mock('is-inside-container', () => ({ default: vi.fn().mockReturnValue(false) }))
vi.mock('@likec4/log', () => ({ loggable: vi.fn((e: unknown) => e) }))

import { resolveHmrPort } from './vite-dev'

async function getEnvMock() {
  const { env } = await import('std-env')
  return env as Record<string, string | undefined>
}

async function getGetPortMock() {
  const { default: getPort } = await import('get-port')
  return getPort as ReturnType<typeof vi.fn>
}

describe('resolveHmrPort', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    // Reset env mock to empty
    const env = await getEnvMock()
    for (const key of Object.keys(env)) {
      delete env[key]
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('auto-discovers port from 24678–24690 range when no hmrPort given and HMR enabled', async () => {
    const getPort = await getGetPortMock()
    getPort.mockResolvedValueOnce(24682)

    const result = await resolveHmrPort(undefined, true)

    // getPort should have been called (auto-discovery triggered)
    expect(getPort).toHaveBeenCalledOnce()
    // result comes from getPort's return value
    expect(result).toBe(24682)
  })

  it('uses explicit hmrPort verbatim without calling getPort', async () => {
    const getPort = await getGetPortMock()

    const result = await resolveHmrPort(24700, true)

    expect(getPort).not.toHaveBeenCalled()
    expect(result).toBe(24700)
  })

  it('uses HMR_PORT env var when no explicit hmrPort given', async () => {
    const env = await getEnvMock()
    env['HMR_PORT'] = '24695'
    const getPort = await getGetPortMock()

    const result = await resolveHmrPort(undefined, true)

    expect(getPort).not.toHaveBeenCalled()
    expect(result).toBe(24695)
  })

  it('prefers explicit hmrPort over HMR_PORT env var', async () => {
    const env = await getEnvMock()
    env['HMR_PORT'] = '24695'
    const getPort = await getGetPortMock()

    const result = await resolveHmrPort(24700, true)

    expect(getPort).not.toHaveBeenCalled()
    expect(result).toBe(24700)
  })

  it('returns undefined when HMR is disabled', async () => {
    const getPort = await getGetPortMock()

    const result = await resolveHmrPort(24700, false)

    expect(getPort).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it('returns undefined when HMR is disabled even if HMR_PORT env var is set', async () => {
    const env = await getEnvMock()
    env['HMR_PORT'] = '24695'
    const getPort = await getGetPortMock()

    const result = await resolveHmrPort(undefined, false)

    expect(getPort).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
