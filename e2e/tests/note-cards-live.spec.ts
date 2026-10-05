// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { expect, test } from '@playwright/test'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

test.describe('note cards in the live editor', () => {
  let directory: string
  let source: string
  let baseURL: string
  let server: ReturnType<typeof spawn> | undefined
  let serverOutput = ''

  // Playwright requires a destructured fixture argument, even when no fixture is needed.
  // oxlint-disable-next-line no-empty-pattern
  test.beforeAll(async ({}, workerInfo) => {
    test.setTimeout(60_000)
    directory = await mkdtemp(join(tmpdir(), 'likec4-note-cards-'))
    source = await readFile(resolve('fixtures/note-cards-live.c4'), 'utf8')
    await writeFile(join(directory, 'model.c4'), source)
    await writeFile(join(directory, '.likec4rc'), JSON.stringify({ name: 'notes-live', implicitViews: false }))
    const port = 62100 + workerInfo.parallelIndex
    baseURL = `http://127.0.0.1:${port}`
    server = spawn(process.execPath, [
      resolve('node_modules/likec4/bin/likec4.mjs'),
      'start',
      directory,
      '--port',
      String(port),
      '--listen',
      '127.0.0.1',
      '--no-build-webcomponent',
    ], { stdio: ['ignore', 'pipe', 'pipe'] })
    const collect = (data: Buffer) => {
      serverOutput = (serverOutput + data.toString()).slice(-8000)
    }
    server.stdout?.on('data', collect)
    server.stderr?.on('data', collect)
    await expect.poll(async () => {
      if (server?.exitCode !== null) throw new Error(`Dev server stopped: ${serverOutput}`)
      return fetch(baseURL).then(response => response.ok, () => false)
    }, { timeout: 45_000 }).toBe(true)
  })

  test.afterAll(async () => {
    if (server && server.exitCode === null) {
      const exited = once(server, 'exit')
      server.kill('SIGTERM')
      await exited
    }
    if (directory) await rm(directory, { recursive: true, force: true })
  })

  test('Fit retains note bounds after a color-only source update', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 })
    await page.goto(`${baseURL}/view/update/`)
    const card = page.locator('[data-likec4-note-card="cloud"]')
    const target = page.locator('.react-flow__node[data-id="cloud"]')
    await expect(card).toBeVisible()
    const position = await card.evaluate(element => ({ left: element.style.left, top: element.style.top }))
    const text = await card.textContent()
    await writeFile(join(directory, 'model.c4'), source.replace('color blue', 'color amber'))
    await expect.poll(() => target.innerHTML()).toContain('amber')
    await expect(card).toHaveText(text ?? '')
    expect(await card.evaluate(element => ({ left: element.style.left, top: element.style.top }))).toEqual(position)
    await page.locator('.react-flow__controls-fitview').click()
    await expect.poll(async () => {
      const frame = await page.locator('.react-flow').first().boundingBox()
      const box = await card.boundingBox()
      return !!frame && !!box && box.x >= frame.x - 1 && box.y >= frame.y - 1
        && box.x + box.width <= frame.x + frame.width + 1
        && box.y + box.height <= frame.y + frame.height + 1
    }).toBe(true)
  })

  test('same-ID edge updates report pending before the new note bounds are ready', async ({ page }) => {
    await writeFile(join(directory, 'model.c4'), source)
    const fixturePath = pathToFileURL(resolve('fixtures/note-cards-react.html')).pathname
    await page.goto(`${baseURL}/@fs${fixturePath}`)
    const measurement = page.getByTestId('content-bounds')
    await expect(measurement).toHaveAttribute('data-ready', 'true')
    const edge = page.locator('.react-flow__edge[data-id]').first()
    const edgeId = await edge.getAttribute('data-id')
    await writeFile(join(directory, 'model.c4'), source.replace('\'opens\'', '\'opens with an updated label\''))
    const updates = () =>
      measurement.evaluate(element => {
        const values: { label: string; ready: boolean }[] = JSON.parse(element.getAttribute('data-updates') ?? '[]')
        return values.filter(value => value.label === 'opens with an updated label')
      })
    await expect.poll(updates).not.toHaveLength(0)
    expect((await updates())[0]?.ready).toBe(false)
    await expect(edge).toHaveAttribute('data-id', edgeId ?? '')
    await expect(measurement).toHaveAttribute('data-ready', 'true')
    await writeFile(join(directory, 'model.c4'), source)
  })

  test('card placement stays fixed during a drag and clears the target after drop', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 })
    await page.goto(`${baseURL}/view/update/`)
    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    const card = page.locator('[data-likec4-note-card="cloud"]')
    const target = page.locator('.react-flow__node[data-id="cloud"]')
    await expect(card).toBeVisible()
    const before = await target.boundingBox()
    if (!before) throw new Error('Missing target bounds')
    const position = await card.evaluate(element => ({ left: element.style.left, top: element.style.top }))
    const viewport = await page.locator('.react-flow__viewport').getAttribute('style')
    const x = before.x + before.width / 2
    const y = before.y + before.height / 2
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x - 160, y + 80, { steps: 10 })
    await expect.poll(async () => (await target.boundingBox())?.x).toBeLessThan(before.x - 100)
    expect(await page.locator('.react-flow__viewport').getAttribute('style')).toBe(viewport)
    expect(await card.evaluate(element => ({ left: element.style.left, top: element.style.top }))).toEqual(position)
    await page.mouse.up()
    await expect.poll(() => card.evaluate(element => ({ left: element.style.left, top: element.style.top })))
      .not.toEqual(position)
    await expect.poll(async () => {
      const box = await card.boundingBox()
      const node = await target.boundingBox()
      if (!box || !node) return -1
      return Math.max(0, Math.min(box.x + box.width, node.x + node.width) - Math.max(box.x, node.x))
        * Math.max(0, Math.min(box.y + box.height, node.y + node.height) - Math.max(box.y, node.y))
    }).toBe(0)
  })

  test('ReactLikeC4 uses note bounds for its aspect ratio and forwards the bounds callback', async ({ page }) => {
    const fixturePath = pathToFileURL(resolve('fixtures/note-cards-react.html')).pathname
    await page.goto(`${baseURL}/@fs${fixturePath}`)
    const measurement = page.getByTestId('content-bounds')
    await expect(measurement).toHaveAttribute('data-ready', 'true')
    const width = Number(await measurement.getAttribute('data-width'))
    const height = Number(await measurement.getAttribute('data-height'))
    const wrapper = page.locator('.likec4-view')
    await expect.poll(() => wrapper.evaluate(element => getComputedStyle(element).aspectRatio))
      .toBe(`${Math.ceil(width)} / ${Math.ceil(height)}`)
    await expect(wrapper.locator('[data-likec4-note-card]')).toBeVisible()
  })
})
