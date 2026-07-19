import { LikeC4 } from '@likec4/language-services/node'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { PassThrough, Writable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { startLikeC4MCP } from '../index'
import { StdioLikeC4MCPServer } from '../server/StdioLikeC4MCPServer'

const tempDirs: string[] = []

afterEach(async () => {
  while (tempDirs.length > 0) {
    await rm(tempDirs.pop()!, { recursive: true, force: true })
  }
})

async function createWorkspace() {
  const dir = await mkdtemp(path.join(tmpdir(), 'likec4-mcp-stdio-'))
  tempDirs.push(dir)
  await writeFile(
    path.join(dir, 'model.c4'),
    `
      specification {
        element system
      }
      model {
        app = system 'App'
      }
      views {
        view index {
          include *
        }
      }
    `,
  )
  return dir
}

function discardOutput() {
  return new Writable({
    write(_chunk, _encoding, callback) {
      callback()
    },
  })
}

describe('MCP stdio lifecycle', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    ['EOF', (stdin: PassThrough) => stdin.end()],
    ['close', (stdin: PassThrough) => stdin.destroy()],
  ])('stops the server and disposes language services when stdin reaches %s', async (_event, closeStdin) => {
    const workspacePath = await createWorkspace()
    const stdin = new PassThrough()
    const stdout = discardOutput()

    const started = await startLikeC4MCP({
      workspacePath,
      mcp: 'stdio',
      watch: true,
      configureLogger: false,
      stdio: { stdin, stdout },
    })
    const dispose = vi.spyOn(started.likec4, 'dispose')

    closeStdin(stdin)

    await vi.waitFor(() => {
      expect(started.server.isStarted).toBe(false)
      expect(dispose).toHaveBeenCalledOnce()
    })
  })

  it('disposes language services when the stdio server fails to start', async () => {
    const workspacePath = await createWorkspace()
    const startError = new Error('stdio start failed')
    vi.spyOn(StdioLikeC4MCPServer.prototype, 'start').mockRejectedValueOnce(startError)
    const dispose = vi.spyOn(LikeC4.prototype, 'dispose')

    await expect(startLikeC4MCP({
      workspacePath,
      mcp: 'stdio',
      watch: true,
      configureLogger: false,
      stdio: {
        stdin: new PassThrough(),
        stdout: discardOutput(),
      },
    })).rejects.toThrow(startError)

    expect(dispose).toHaveBeenCalledOnce()
  })

  it('does not start the stdio server when stdin is already closed', async () => {
    const workspacePath = await createWorkspace()
    const stdin = new PassThrough()
    stdin.destroy()
    const start = vi.spyOn(StdioLikeC4MCPServer.prototype, 'start')
    const dispose = vi.spyOn(LikeC4.prototype, 'dispose')

    const started = await startLikeC4MCP({
      workspacePath,
      mcp: 'stdio',
      watch: true,
      configureLogger: false,
      stdio: {
        stdin,
        stdout: discardOutput(),
      },
    })

    expect(start).not.toHaveBeenCalled()
    expect(started.server.isStarted).toBe(false)
    expect(dispose).toHaveBeenCalledOnce()
  })
})
