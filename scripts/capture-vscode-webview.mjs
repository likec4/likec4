// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { writeFile } from 'node:fs/promises'

const argumentsByName = new Map()
for (let index = 2; index < process.argv.length; index += 2) {
  const name = process.argv[index]
  const value = process.argv[index + 1]
  if (!name?.startsWith('--') || value === undefined) {
    throw new Error(`Expected a value after ${name ?? 'the final argument'}.`)
  }
  argumentsByName.set(name, value)
}

const port = Number(argumentsByName.get('--port'))
const outputPath = argumentsByName.get('--output')
const consolePath = argumentsByName.get('--console')
const targetsPath = `${outputPath}.targets.json`

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('Pass --port with a valid TCP port.')
}
if (!outputPath || !consolePath) {
  throw new Error('Pass both --output and --console paths.')
}

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

const targetMatches = target => {
  const url = target.url?.toLowerCase() ?? ''
  return target.type === 'iframe' && url.includes('extensionid=likec4.likec4-vscode')
}

const findTarget = async () => {
  const deadline = Date.now() + 60_000
  const endpoint = `http://127.0.0.1:${port}/json/list`
  let lastError

  while (Date.now() < deadline) {
    try {
      const response = await fetch(endpoint)
      if (!response.ok) {
        throw new Error(`CDP endpoint returned ${response.status}.`)
      }
      const targets = await response.json()
      const target = targets.find(targetMatches)
      await writeFile(
        targetsPath,
        `${
          JSON.stringify(
            {
              endpoint,
              observedAt: new Date().toISOString(),
              targets,
              selectedTarget: target ?? null,
            },
            null,
            2,
          )
        }\n`,
      )
      if (target?.webSocketDebuggerUrl) {
        return target
      }
      lastError = new Error('No LikeC4 webview target is available.')
    } catch (error) {
      lastError = error
    }
    await sleep(500)
  }

  throw new Error(`Could not find a LikeC4 webview target: ${lastError?.message ?? 'unknown error'}`)
}

const cdp = async (socket, id, method, params = {}) => {
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.removeEventListener('message', onMessage)
      socket.removeEventListener('error', onError)
      reject(new Error(`Timed out: ${method}`))
    }, 20_000)
    const onMessage = event => {
      const message = JSON.parse(event.data)
      if (message.id === id) {
        socket.removeEventListener('message', onMessage)
        socket.removeEventListener('error', onError)
        clearTimeout(timeout)
        if (message.error) {
          reject(new Error(`${method}: ${message.error.message}`))
          return
        }
        resolve(message.result)
      }
    }
    const onError = () => {
      socket.removeEventListener('message', onMessage)
      clearTimeout(timeout)
      reject(new Error(`CDP connection failed: ${method}`))
    }
    socket.addEventListener('message', onMessage)
    socket.addEventListener('error', onError, { once: true })
    socket.send(JSON.stringify({ id, method, params }))
  })
}

const main = async () => {
  const target = await findTarget()
  const socket = new WebSocket(target.webSocketDebuggerUrl)
  const entries = []

  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out connecting to CDP.')), 20_000)
      socket.addEventListener('open', () => {
        clearTimeout(timeout)
        resolve()
      }, { once: true })
      socket.addEventListener('error', () => {
        clearTimeout(timeout)
        reject(new Error('Could not connect to CDP.'))
      }, { once: true })
    })

    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      if (message.method === 'Log.entryAdded') {
        entries.push(message.params.entry)
      }
    })

    await cdp(socket, 1, 'Log.enable')
    await cdp(socket, 2, 'Page.enable')
    await cdp(socket, 3, 'Runtime.evaluate', { expression: 'location.reload()' })
    await sleep(12_000)
    const screenshot = await cdp(socket, 4, 'Page.captureScreenshot', { format: 'png' })

    await writeFile(consolePath, `${JSON.stringify(entries, null, 2)}\n`)
    if (entries.length === 0) {
      throw new Error('CDP did not capture any Log.entryAdded entries.')
    }
    if (!screenshot?.data) {
      throw new Error('CDP did not capture a screenshot.')
    }
    await writeFile(outputPath, Buffer.from(screenshot.data, 'base64'))
  } finally {
    socket.close()
  }
}

await main()
process.exit(0)
