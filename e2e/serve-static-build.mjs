// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { resolve, sep } from 'node:path'

const [rootArg, portArg = '5175'] = process.argv.slice(2)
if (!rootArg) {
  throw new Error('Usage: node serve-static-build.mjs <root> [port]')
}

const root = resolve(rootArg)
const port = Number(portArg)

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
])

function resolveRequest(pathname) {
  let relative
  try {
    relative = decodeURIComponent(pathname).replace(/^\/+/, '')
  } catch {
    return null
  }

  const candidate = resolve(root, relative)
  if (candidate !== root && !candidate.startsWith(root + sep)) {
    return resolve(root, 'index.html')
  }
  try {
    if (statSync(candidate).isFile()) {
      return candidate
    }
  } catch {
    // Fall through to SPA fallback.
  }
  return resolve(root, 'index.html')
}

function contentType(file) {
  const ext = file.slice(file.lastIndexOf('.'))
  return mimeTypes.get(ext) ?? 'application/octet-stream'
}

const server = createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405)
    response.end()
    return
  }

  let url
  try {
    url = new URL(request.url ?? '/', 'http://127.0.0.1')
  } catch {
    response.writeHead(400)
    response.end()
    return
  }

  const file = resolveRequest(url.pathname)
  if (!file) {
    response.writeHead(400)
    response.end()
    return
  }

  response.setHeader('content-type', contentType(file))

  if (request.method === 'HEAD') {
    response.end()
    return
  }

  createReadStream(file)
    .on('error', () => {
      response.writeHead(404)
      response.end()
    })
    .pipe(response)
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`)
})
