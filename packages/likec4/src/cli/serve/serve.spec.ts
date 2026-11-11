import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock heavy dependencies to isolate handler wiring logic
vi.mock('@likec4/language-services/node', () => ({
  fromWorkspace: vi.fn().mockResolvedValue({
    workspace: '/tmp/test-workspace',
    dispose: vi.fn(),
  }),
}))

// Partial mock: tests run with `--no-isolate`, modules loaded here may be reused by other spec files
vi.mock('node:fs/promises', async importOriginal => ({
  ...(await importOriginal<typeof import('node:fs/promises')>()),
  mkdtemp: vi.fn().mockResolvedValue('/tmp/.likec4-assets-abc'),
}))

const mockViteDevServer = {
  config: {
    logger: {
      clearScreen: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    },
  },
  watcher: {
    add: vi.fn(),
    on: vi.fn(),
  },
  resolvedUrls: { local: ['http://localhost:5173/'] },
}

vi.mock('../../vite/vite-dev', () => ({
  viteDev: vi.fn().mockResolvedValue(mockViteDevServer),
}))

vi.mock('../../vite/printServerUrls', () => ({
  printServerUrls: vi.fn(),
}))

vi.mock('../support-message', () => ({
  showSupportUsMessage: vi.fn(),
}))

describe('serve handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('propagates hmrPort to viteDev', async () => {
    const { handler } = await import('./serve')
    const { viteDev } = await import('../../vite/vite-dev')
    const viteDevMock = viteDev as ReturnType<typeof vi.fn>

    await handler({
      path: '/tmp/test',
      useDotBin: false,
      webcomponentPrefix: 'likec4',
      title: undefined,
      useHashHistory: undefined,
      enableHMR: false, // disable HMR to simplify – we only care about propagation
      enableWebcomponent: false,
      hmrPort: 24700,
    })

    expect(viteDevMock).toHaveBeenCalledOnce()
    const callArg = viteDevMock.mock.calls[0]![0]
    expect(callArg.hmrPort).toBe(24700)
  })

  it('propagates undefined hmrPort when not provided (triggers auto-discovery)', async () => {
    const { handler } = await import('./serve')
    const { viteDev } = await import('../../vite/vite-dev')
    const viteDevMock = viteDev as ReturnType<typeof vi.fn>

    await handler({
      path: '/tmp/test',
      useDotBin: false,
      webcomponentPrefix: 'likec4',
      title: undefined,
      useHashHistory: undefined,
      enableHMR: false,
      enableWebcomponent: false,
      // hmrPort intentionally omitted
    })

    expect(viteDevMock).toHaveBeenCalledOnce()
    const callArg = viteDevMock.mock.calls[0]![0]
    expect(callArg.hmrPort).toBeUndefined()
  })

  it('propagates port and hmrPort to viteDev', async () => {
    const { handler } = await import('./serve')
    const { viteDev } = await import('../../vite/vite-dev')
    const viteDevMock = viteDev as ReturnType<typeof vi.fn>

    await handler({
      path: '/tmp/test',
      useDotBin: false,
      webcomponentPrefix: 'likec4',
      title: undefined,
      useHashHistory: undefined,
      enableHMR: false,
      enableWebcomponent: false,
      port: 8080,
      hmrPort: 24705,
    })

    expect(viteDevMock).toHaveBeenCalledOnce()
    const callArg = viteDevMock.mock.calls[0]![0]
    expect(callArg.port).toBe(8080)
    expect(callArg.hmrPort).toBe(24705)
  })

  it('propagates userPublicDir to viteDev', async () => {
    const { handler } = await import('./serve')
    const { viteDev } = await import('../../vite/vite-dev')
    const viteDevMock = viteDev as ReturnType<typeof vi.fn>

    await handler({
      path: '/tmp/test',
      useDotBin: false,
      webcomponentPrefix: 'likec4',
      title: undefined,
      useHashHistory: undefined,
      enableHMR: false,
      enableWebcomponent: false,
      userPublicDir: '/tmp/test/public',
    })

    expect(viteDevMock).toHaveBeenCalledOnce()
    const callArg = viteDevMock.mock.calls[0]![0]
    expect(callArg.userPublicDir).toBe('/tmp/test/public')
  })

  it('propagates allowedHosts to viteDev', async () => {
    const { handler } = await import('./serve')
    const { viteDev } = await import('../../vite/vite-dev')
    const viteDevMock = viteDev as ReturnType<typeof vi.fn>

    await handler({
      path: '/tmp/test',
      useDotBin: false,
      webcomponentPrefix: 'likec4',
      title: undefined,
      useHashHistory: undefined,
      enableHMR: false,
      enableWebcomponent: false,
      allowedHosts: ['example.local', 'review.example.com'],
    })

    expect(viteDevMock).toHaveBeenCalledOnce()
    const callArg = viteDevMock.mock.calls[0]![0]
    expect(callArg.allowedHosts).toEqual(['example.local', 'review.example.com'])
  })

  it('propagates undefined allowedHosts when not provided (preserves "allow all" default)', async () => {
    const { handler } = await import('./serve')
    const { viteDev } = await import('../../vite/vite-dev')
    const viteDevMock = viteDev as ReturnType<typeof vi.fn>

    await handler({
      path: '/tmp/test',
      useDotBin: false,
      webcomponentPrefix: 'likec4',
      title: undefined,
      useHashHistory: undefined,
      enableHMR: false,
      enableWebcomponent: false,
    })

    expect(viteDevMock).toHaveBeenCalledOnce()
    const callArg = viteDevMock.mock.calls[0]![0]
    expect(callArg.allowedHosts).toBeUndefined()
  })

  it('propagates theme and customization to viteDev', async () => {
    const { handler } = await import('./serve')
    const { viteDev } = await import('../../vite/vite-dev')
    const viteDevMock = viteDev as ReturnType<typeof vi.fn>

    await handler({
      path: '/tmp/test',
      useDotBin: false,
      webcomponentPrefix: 'likec4',
      title: undefined,
      useHashHistory: undefined,
      enableHMR: false,
      enableWebcomponent: false,
      theme: 'dark',
      customization: '/tmp/test/likec4.customization.tsx',
    })

    expect(viteDevMock).toHaveBeenCalledOnce()
    const callArg = viteDevMock.mock.calls[0]![0]
    expect(callArg.theme).toBe('dark')
    expect(callArg.customization).toBe('/tmp/test/likec4.customization.tsx')
    expect(mockViteDevServer.watcher.add).not.toHaveBeenCalled()
  })

  it('warns that a restart is required when the app config changes', async () => {
    const { handler } = await import('./serve')
    const appConfigFile = '/tmp/test/likec4.app.config.ts'

    await handler({
      path: '/tmp/test',
      useDotBin: false,
      webcomponentPrefix: 'likec4',
      title: undefined,
      useHashHistory: undefined,
      enableHMR: false,
      enableWebcomponent: false,
      appConfigFile,
    })

    expect(mockViteDevServer.watcher.add).toHaveBeenCalledWith(appConfigFile)
    const [event, onChange] = mockViteDevServer.watcher.on.mock.calls[0]!
    expect(event).toBe('change')

    onChange('/tmp/test/model.c4')
    expect(mockViteDevServer.config.logger.warn).not.toHaveBeenCalled()

    onChange(appConfigFile)
    expect(mockViteDevServer.config.logger.warn).toHaveBeenCalledOnce()
    expect(mockViteDevServer.config.logger.warn.mock.calls[0]![0]).toContain('restart to apply')
  })
})
