// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import { expect, test } from '@playwright/test'

const viewUrl = '/project/e2e/view/note-cards-export/'
const exportUrl = (format: 'png' | 'jpeg') =>
  `/project/e2e/export/note-cards-export/?padding=22${format === 'jpeg' ? '&format=jpeg' : ''}`

function overlapArea(a: { x: number; y: number; width: number; height: number }, b: {
  x: number
  y: number
  width: number
  height: number
}) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  return width * height
}

test('regular diagram shows full note cards and straight dashed leaders for their targets', async ({ page }) => {
  await page.goto(viewUrl)

  const cards = page.locator('[data-likec4-note-card]')
  const leaders = page.locator('[data-likec4-note-leaders] g[data-note-target]')
  await expect(cards).toHaveCount(2)
  await expect(cards.nth(0)).toBeVisible()
  await expect(cards.nth(1)).toBeVisible()
  await expect(cards.filter({ hasText: 'The complete text must fit inside the exported image.' })).toHaveCount(1)
  await expect(cards.filter({ hasText: 'Its dashed leader and target dot must remain visible' })).toHaveCount(1)
  await expect(cards.locator('.code-line')).toHaveText(
    'const this_is_a_long_code_identifier_that_has_seventy_or_more_characters_in_one_line = true',
  )
  for (const card of await cards.all()) {
    const size = await card.evaluate(element => ({
      width: element instanceof HTMLElement ? element.offsetWidth : 0,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }))
    expect(size.width).toBe(240)
    expect(size.scrollWidth).toBeLessThanOrEqual(size.clientWidth + 1)
  }
  await expect(leaders).toHaveCount(2)
  await expect(page.locator('.react-flow__node-element .__paper-front')).toHaveCount(0)

  const targets = await leaders.evaluateAll(groups =>
    groups.map(group => {
      const id = group.getAttribute('data-note-target')
      const line = group.querySelector('line')
      const dot = group.querySelector('circle')
      const target = [...document.querySelectorAll('.react-flow__node, .react-flow__edge')]
        .find(element => element.getAttribute('data-id') === id)
      return {
        id,
        hasCard: !!id && !!document.querySelector(`[data-likec4-note-card="${CSS.escape(id)}"]`),
        targetType: target?.classList.contains('react-flow__edge') ?
          'edge'
          : target?.classList.contains('react-flow__node') ?
          'node'
          : 'missing',
        straight: line?.tagName.toLowerCase() === 'line',
        dashed: !!line?.getAttribute('stroke-dasharray'),
        hasDot: dot?.tagName.toLowerCase() === 'circle',
      }
    })
  )
  expect(targets.map(target => target.targetType).sort()).toEqual(['edge', 'node'])
  expect(targets.every(target => target.hasCard && target.straight && target.dashed && target.hasDot)).toBe(true)

  const elementNodes = page.locator('.react-flow__node-element')
  await expect(elementNodes.first()).toBeVisible()
  const elementBoxes = await Promise.all((await elementNodes.all()).map(element => element.boundingBox()))
  for (const card of await cards.all()) {
    const cardBox = await card.boundingBox()
    expect(cardBox).not.toBeNull()
    if (!cardBox) continue
    for (const elementBox of elementBoxes) {
      expect(elementBox).not.toBeNull()
      if (!elementBox) continue
      expect(overlapArea(cardBox, elementBox)).toBe(0)
    }
  }
})

test('element and relationship cards stay outside the compound frame', async ({ page }) => {
  await page.goto('/project/e2e/view/note-cards-compound-frame/')
  const cards = page.locator('[data-likec4-note-card]')
  const frames = page.locator('.react-flow__node-compound-element')
  await expect(cards).toHaveCount(2)
  await expect(page.locator('[data-likec4-note-leaders] g[data-note-target]')).toHaveCount(2)
  await expect(frames.first()).toBeVisible()

  const frameBoxes = await Promise.all((await frames.all()).map(frame => frame.boundingBox()))
  for (const card of await cards.all()) {
    const cardBox = await card.boundingBox()
    expect(cardBox).not.toBeNull()
    if (!cardBox) continue
    for (const frameBox of frameBoxes) {
      expect(frameBox).not.toBeNull()
      if (!frameBox) continue
      expect(overlapArea(cardBox, frameBox)).toBe(0)
    }
  }
})

for (
  const [view, count, nodeCount, frameCount, edgeCount] of [
    ['sparse', 6, 4, 0, 3],
    ['readableNested', 9, 12, 3, 14],
  ] as const
) {
  test(`${count}-note example keeps cards, paths, leaders, and target dots clear`, async ({ page }) => {
    await page.goto(`/project/note-placement/export/${view}/?padding=22`)
    await expect(page.getByTestId('export-page')).toHaveAttribute('data-likec4-export-ready', 'true')
    await expect(page.locator('[data-likec4-note-card]')).toHaveCount(count)
    await expect(page.locator('[data-note-target]')).toHaveCount(count)
    await expect(page.locator('[data-note-target] line')).toHaveCount(count)
    await expect(page.locator('[data-note-target] circle')).toHaveCount(count)
    await expect(page.locator('.react-flow__node-element')).toHaveCount(nodeCount)
    await expect(page.locator('.react-flow__node-compound-element')).toHaveCount(frameCount)
    const relationships = page.locator('.react-flow__edge[data-id]')
    await expect(relationships).toHaveCount(edgeCount)
    for (const relationship of await relationships.all()) {
      const path = relationship.locator('.react-flow__edge-path:not(.hide-on-reduced-graphics)')
      await expect(path).toHaveCount(1)
      // Horizontal SVG paths have zero-height boxes, so Playwright's visibility check does not apply.
      await expect(path).not.toHaveCSS('display', 'none')
      await expect(path).toHaveCSS('visibility', 'visible')
      expect(await path.evaluate(element => element instanceof SVGPathElement ? element.getTotalLength() : 0))
        .toBeGreaterThan(0)
    }
    for (const card of await page.locator('[data-likec4-note-card]').all()) {
      await expect(card).toBeVisible()
    }

    const collisions = await page.evaluate(() => {
      type Box = { x: number; y: number; width: number; height: number }
      type Segment = { from: DOMPoint; to: DOMPoint }
      const through = ({ from, to }: Segment, box: Box) => {
        let start = 0
        let end = 1
        for (const [axis, extent] of [['x', 'width'], ['y', 'height']] as const) {
          const delta = to[axis] - from[axis]
          const lower = box[axis] + 0.01
          const upper = box[axis] + box[extent] - 0.01
          if (Math.abs(delta) < 1e-9) {
            if (from[axis] <= lower || from[axis] >= upper) return false
          } else {
            const a = (lower - from[axis]) / delta
            const b = (upper - from[axis]) / delta
            start = Math.max(start, Math.min(a, b))
            end = Math.min(end, Math.max(a, b))
            if (end <= start) return false
          }
        }
        return end > start
      }
      const overlap = (a: Box, b: Box) =>
        Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0.01 &&
        Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 0.01
      const cards = [...document.querySelectorAll<HTMLElement>('[data-likec4-note-card]')].map(element => ({
        id: element.dataset['likec4NoteCard'],
        bounds: element.getBoundingClientRect(),
        overflow: element.scrollWidth > element.clientWidth + 1,
      }))
      const nodes = [...document.querySelectorAll<HTMLElement>('.react-flow__node-element')].map(element => ({
        id: element.dataset['id'],
        bounds: element.getBoundingClientRect(),
      }))
      const leaders = [...document.querySelectorAll<SVGLineElement>('[data-note-target] line')].map(line => {
        const transform = line.getScreenCTM()
        if (!transform) throw new Error('Missing note leader transform')
        return {
          id: line.parentElement?.dataset['noteTarget'],
          dot: line.parentElement?.querySelector('circle')?.getBoundingClientRect(),
          from: new DOMPoint(line.x1.baseVal.value, line.y1.baseVal.value).matrixTransform(transform),
          to: new DOMPoint(line.x2.baseVal.value, line.y2.baseVal.value).matrixTransform(transform),
        }
      })
      const edges = [...document.querySelectorAll<SVGPathElement>(
        '.react-flow__edge-path:not(.hide-on-reduced-graphics)',
      )].flatMap(path => {
        const transform = path.getScreenCTM()
        if (!transform) throw new Error('Missing relationship path transform')
        const length = path.getTotalLength()
        return Array.from({ length: 100 }, (_, i) => ({
          from: path.getPointAtLength(length * i / 100).matrixTransform(transform),
          to: path.getPointAtLength(length * (i + 1) / 100).matrixTransform(transform),
        }))
      })
      const zoom = cards[0]!.bounds.width / 240
      const frames = [...document.querySelectorAll('.react-flow__node-compound-element')].flatMap(element => {
        const b = element.getBoundingClientRect()
        const header = Math.min(b.height, 40 * zoom)
        const border = 4 * zoom
        return [
          { x: b.x, y: b.y, width: b.width, height: header },
          { x: b.x, y: b.y + header, width: border, height: b.height - header },
          { x: b.right - border, y: b.y + header, width: border, height: b.height - header },
          { x: b.x, y: b.bottom - border, width: b.width, height: border },
        ]
      })
      const violations: string[] = []
      for (const card of cards) {
        if (card.overflow) violations.push(`text overflow: ${card.id}`)
        for (const node of nodes) {
          if (overlap(card.bounds, node.bounds)) violations.push(`card/node: ${card.id}/${node.id}`)
        }
        if (frames.some(frame => overlap(card.bounds, frame))) violations.push(`card/frame: ${card.id}`)
        if (edges.some(edge => through(edge, card.bounds))) violations.push(`card/relationship: ${card.id}`)
        for (const other of cards) {
          if (other.id !== card.id && overlap(card.bounds, other.bounds)) {
            violations.push(`card/card: ${card.id}/${other.id}`)
          }
        }
        for (const leader of leaders) {
          if (leader.id === card.id) continue
          if (through(leader, card.bounds)) violations.push(`hidden leader: ${card.id}/${leader.id}`)
          if (leader.dot && overlap(leader.dot, card.bounds)) {
            violations.push(`hidden target dot: ${card.id}/${leader.id}`)
          }
        }
      }
      for (const leader of leaders) {
        for (const node of nodes) {
          if (leader.id !== node.id && through(leader, node.bounds)) {
            violations.push(`leader/node: ${leader.id}/${node.id}`)
          }
        }
      }
      return violations
    })
    expect(collisions).toEqual([])
  })
}

test('fit view includes both note cards in a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 })
  await page.goto(viewUrl)
  const canvas = page.locator('.react-flow').first()
  const cards = page.locator('[data-likec4-note-card]')
  await expect(cards).toHaveCount(2)
  await page.locator('.react-flow__controls-fitview').click()

  await expect.poll(async () => {
    const frame = await canvas.boundingBox()
    if (!frame) return false
    for (const card of await cards.all()) {
      const box = await card.boundingBox()
      if (
        !box || box.x < frame.x - 1 || box.y < frame.y - 1 ||
        box.x + box.width > frame.x + frame.width + 1 || box.y + box.height > frame.y + frame.height + 1
      ) {
        return false
      }
    }
    return true
  }).toBe(true)
})

test('dynamic diagram shows relationship note cards, while sequence mode keeps its current treatment', async ({ page }) => {
  await page.goto('/project/e2e/view/dynamic-view-1/?dynamic=diagram')
  const cards = page.locator('[data-likec4-note-card]')
  await expect(cards).toHaveCount(2)
  await expect(cards.filter({ hasText: 'Customer opens dashboard in Browser' })).toBeVisible()
  await expect(cards.filter({ hasText: 'Next notes' })).toBeVisible()
  await expect(page.locator('[data-likec4-note-leaders] g[data-note-target]')).toHaveCount(2)

  await page.goto('/project/e2e/view/dynamic-view-1/?dynamic=sequence')
  await expect(page.locator('.react-flow__node-seq-actor').first()).toBeVisible()
  await expect(cards).toHaveCount(0)
})

test('full-size embed includes both note cards inside its diagram bounds', async ({ page }) => {
  await page.goto('/project/e2e/embed/note-cards-export/')

  const canvas = page.locator('.react-flow').first()
  const cards = page.locator('[data-likec4-note-card]')
  await expect(canvas).toBeVisible()
  await expect(cards).toHaveCount(2)
  await expect(cards.nth(0)).toBeVisible()
  await expect(cards.nth(1)).toBeVisible()

  const frame = await canvas.boundingBox()
  expect(frame).not.toBeNull()
  if (!frame) return
  for (const card of await cards.all()) {
    const box = await card.boundingBox()
    expect(box).not.toBeNull()
    if (!box) continue
    expect(box.x).toBeGreaterThanOrEqual(frame.x - 1)
    expect(box.y).toBeGreaterThanOrEqual(frame.y - 1)
    expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width + 1)
    expect(box.y + box.height).toBeLessThanOrEqual(frame.y + frame.height + 1)
  }
})

test('dark theme keeps note cards readable', async ({ page }) => {
  await page.goto(`${viewUrl}?theme=dark`)
  await expect(page.locator('html')).toHaveAttribute('data-mantine-color-scheme', 'dark')
  const card = page.locator('[data-likec4-note-card]').first()
  await expect(card).toBeVisible()

  const contrast = await card.evaluate(element => {
    const style = getComputedStyle(element)
    const channels = (color: string) => color.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? []
    const luminance = (values: number[]) => {
      const [r = 0, g = 0, b = 0] = values.map(value => {
        const channel = value / 255
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const foreground = luminance(channels(style.color))
    const background = luminance(channels(style.backgroundColor))
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      ratio: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05),
    }
  })
  expect(contrast.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
  expect(contrast.ratio).toBeGreaterThan(4.5)
})

test('export readiness waits for a note image to finish loading', async ({ page }) => {
  let releaseImage: (() => void) | undefined
  const imageGate = new Promise<void>(resolve => {
    releaseImage = resolve
  })
  await page.route('https://example.invalid/likec4-note.svg', async route => {
    await imageGate
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body:
        '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" fill="#d3b45a"/></svg>',
    })
  })

  await page.goto('/project/e2e/export/note-cards-delayed-image/?padding=22', { waitUntil: 'domcontentloaded' })
  const exportPage = page.getByTestId('export-page')
  const card = page.locator('[data-likec4-note-card]')
  const image = card.locator('img')
  await expect(card).toHaveCount(1)
  await expect(card).toBeVisible()
  await expect(image).toHaveCount(1)
  await expect(exportPage).toHaveAttribute('data-likec4-export-ready', 'false')
  expect(await image.evaluate(element => element instanceof HTMLImageElement && element.complete)).toBe(false)

  releaseImage?.()
  await expect(image).toHaveJSProperty('complete', true)
  expect(await image.evaluate(element => element instanceof HTMLImageElement ? element.naturalWidth : 0))
    .toBeGreaterThan(0)
  await expect(card).toBeVisible()
  await expect(exportPage).toHaveAttribute('data-likec4-export-ready', 'true')
})

for (const route of ['view', 'embed'] as const) {
  test(`${route} fits the complete note after its delayed image loads`, async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 })
    const imageGate = Promise.withResolvers<void>()
    await page.route('https://example.invalid/likec4-note.svg', async request => {
      await imageGate.promise
      await request.fulfill({
        contentType: 'image/svg+xml',
        body:
          '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="1500"><rect width="240" height="1500" fill="#d3b45a"/></svg>',
      })
    })
    try {
      await page.goto(`/project/e2e/${route}/note-cards-delayed-image/`, { waitUntil: 'domcontentloaded' })
      const card = page.locator('[data-likec4-note-card]')
      const image = card.locator('img')
      await expect(card).toBeVisible()
      await expect(image).toHaveJSProperty('complete', false)
      imageGate.resolve()
      await expect(image).toHaveJSProperty('complete', true)
      await expect(image).toHaveJSProperty('naturalHeight', 1500)

      // Initial fitting must include the loaded image without a user clicking Fit.
      await expect.poll(async () => {
        const frame = await page.locator('.react-flow').first().boundingBox()
        const box = await card.boundingBox()
        return !!frame && !!box && box.x >= frame.x - 1 && box.y >= frame.y - 1
          && box.x + box.width <= frame.x + frame.width + 1
          && box.y + box.height <= frame.y + frame.height + 1
      }).toBe(true)
    } finally {
      imageGate.resolve()
    }
  })
}

test('same-view export query switch from PNG to JPEG settles the new format', async ({ page }) => {
  await page.goto(exportUrl('png'))
  const exportPage = page.getByTestId('export-page')
  await expect(exportPage).toHaveAttribute('data-likec4-export-ready', 'true')
  await expect(page.locator('[data-likec4-note-card]')).toHaveCount(2)
  expect(await exportPage.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)')

  await page.evaluate(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('format', 'jpeg')
    window.history.pushState({}, '', url)
    window.dispatchEvent(new PopStateEvent('popstate'))
  })

  await expect(exportPage).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  await expect(exportPage).toHaveAttribute('data-likec4-export-ready', 'true')
  await expect(page.locator('[data-likec4-note-card]')).toHaveCount(2)
})

for (const format of ['png', 'jpeg'] as const) {
  test(`${format.toUpperCase()} export contains the measured element and relationship note cards`, async ({ page }) => {
    await page.goto(exportUrl(format))

    const exportPage = page.getByTestId('export-page')
    await expect(exportPage).toHaveAttribute('data-likec4-export-ready', 'true')

    const cards = page.locator('[data-likec4-note-card]')
    const leaders = page.locator('[data-likec4-note-leaders] g[data-note-target]')
    await expect(cards).toHaveCount(2)
    await expect(leaders).toHaveCount(2)
    await expect(cards.filter({ hasText: 'This long element note' })).toHaveCount(1)
    await expect(cards.filter({ hasText: 'This relationship note' })).toHaveCount(1)

    const noteImage = cards.locator('img')
    await expect(noteImage).toHaveCount(1)
    expect(
      await noteImage.evaluate(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0),
    )
      .toBe(true)

    const exportBox = await exportPage.boundingBox()
    expect(exportBox).not.toBeNull()
    if (!exportBox) return
    const viewport = page.viewportSize()
    if (!viewport || exportBox.width > viewport.width || exportBox.height > viewport.height) {
      await page.setViewportSize({ width: Math.ceil(exportBox.width), height: Math.ceil(exportBox.height) })
      await expect(exportPage).toHaveAttribute('data-likec4-export-ready', 'true')
    }

    const diagramArea = await page.getByTestId('export-diagram-area').boundingBox()
    expect(diagramArea).not.toBeNull()
    if (!diagramArea) return

    for (const item of [cards.nth(0), cards.nth(1), leaders.nth(0), leaders.nth(1)]) {
      const box = await item.boundingBox()
      expect(box).not.toBeNull()
      if (!box) continue
      expect(box.x).toBeGreaterThanOrEqual(diagramArea.x - 1)
      expect(box.y).toBeGreaterThanOrEqual(diagramArea.y - 1)
      expect(box.x + box.width).toBeLessThanOrEqual(diagramArea.x + diagramArea.width + 1)
      expect(box.y + box.height).toBeLessThanOrEqual(diagramArea.y + diagramArea.height + 1)
    }
    for (const card of await cards.all()) {
      expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    }

    const screenshot = await exportPage.screenshot({ type: format, scale: 'css' })
    const imageSize = await page.evaluate(async ({ base64, mime }) => {
      const image = new Image()
      image.src = `data:${mime};base64,${base64}`
      await image.decode()
      return { width: image.naturalWidth, height: image.naturalHeight }
    }, {
      base64: screenshot.toString('base64'),
      mime: format === 'jpeg' ? 'image/jpeg' : 'image/png',
    })
    expect(imageSize.width).toBeGreaterThanOrEqual(Math.floor(exportBox.width))
    expect(imageSize.height).toBeGreaterThanOrEqual(Math.floor(exportBox.height))
  })
}
