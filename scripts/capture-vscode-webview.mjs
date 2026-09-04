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

const isLikeC4Iframe = target => {
  const url = target.url?.toLowerCase() ?? ''
  return target.type === 'iframe' && url.includes('extensionid=likec4.likec4-vscode')
}

const isWorkbenchPage = target => {
  const url = target.url?.toLowerCase() ?? ''
  return target.type === 'page' && url.includes('/workbench/workbench.html')
}

const findTargets = async () => {
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
      const iframeTarget = targets.find(isLikeC4Iframe)
      const workbenchTarget = targets.find(isWorkbenchPage)
      await writeFile(
        targetsPath,
        `${
          JSON.stringify(
            {
              endpoint,
              observedAt: new Date().toISOString(),
              targets,
              iframeTarget: iframeTarget ?? null,
              workbenchTarget: workbenchTarget ?? null,
            },
            null,
            2,
          )
        }\n`,
      )
      if (iframeTarget?.webSocketDebuggerUrl && workbenchTarget?.webSocketDebuggerUrl) {
        return { iframeTarget, workbenchTarget }
      }
      lastError = new Error('LikeC4 iframe or VS Code workbench target is unavailable.')
    } catch (error) {
      lastError = error
    }
    await sleep(500)
  }

  throw new Error(`Could not find the required CDP targets: ${lastError?.message ?? 'unknown error'}`)
}

const openSocket = async target => {
  const socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out connecting to ${target.type} CDP target.`)), 20_000)
    socket.addEventListener('open', () => {
      clearTimeout(timeout)
      resolve()
    }, { once: true })
    socket.addEventListener('error', () => {
      clearTimeout(timeout)
      reject(new Error(`Could not connect to ${target.type} CDP target.`))
    }, { once: true })
  })
  return socket
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
  const { iframeTarget, workbenchTarget } = await findTargets()
  const iframeSocket = await openSocket(iframeTarget)
  const workbenchSocket = await openSocket(workbenchTarget)
  const entries = []

  try {
    iframeSocket.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      if (message.method === 'Log.entryAdded') {
        entries.push(message.params.entry)
      }
    })

    await cdp(iframeSocket, 1, 'Log.enable')
    await cdp(iframeSocket, 2, 'Page.enable')
    await cdp(workbenchSocket, 1, 'Page.enable')
    await cdp(iframeSocket, 3, 'Runtime.evaluate', { expression: 'location.reload()' })
    await sleep(12_000)
    await writeFile(consolePath, `${JSON.stringify(entries, null, 2)}\n`)
    const screenshot = await cdp(workbenchSocket, 2, 'Page.captureScreenshot', { format: 'png' })

    if (entries.length === 0) {
      throw new Error('CDP did not capture any Log.entryAdded entries.')
    }
    if (!screenshot?.data) {
      throw new Error('CDP did not capture a screenshot.')
    }
    await writeFile(outputPath, Buffer.from(screenshot.data, 'base64'))
  } finally {
    iframeSocket.close()
    workbenchSocket.close()
  }
}

await main()
process.exit(0)
