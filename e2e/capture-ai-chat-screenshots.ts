// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

/**
 * Capture AI Chat screenshots for documentation.
 *
 * Usage:
 *   cd e2e && npx playwright test capture-ai-chat-screenshots.ts --config playwright.screenshot.config.ts
 *
 * Screenshots are saved to apps/docs/src/assets/ai-chat/
 */
import { expect, test } from '@playwright/test'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SCREENSHOT_DIR = resolve(__dirname, '../apps/docs/src/assets/ai-chat')
const CANVAS_SELECTOR = '.react-flow.initialized'
const CHAT_BTN_SELECTOR = '.ai-chat-button'
const PROJECT = 'e2e'
const VIEW_URL = `/project/${PROJECT}/view/index/`

test.beforeAll(() => {
  if (!existsSync(SCREENSHOT_DIR)) {
    mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }
})

test.describe('AI Chat documentation screenshots', () => {
  test('capture element with chat icon', async ({ page }) => {
    await page.goto(VIEW_URL)
    await expect(page.locator(CANVAS_SELECTOR).first()).toBeVisible({ timeout: 15_000 })

    // Hover over the first element node to highlight the chat icon
    const elementNode = page.getByTestId('rf__node-customer')
    await elementNode.hover()
    await page.waitForTimeout(400)

    // Full-page screenshot showing the diagram with the chat icon visible
    await page.screenshot({
      path: resolve(SCREENSHOT_DIR, 'ai-chat-element-icon.png'),
    })
  })

  test('capture empty state with suggested questions', async ({ page }) => {
    await page.goto(VIEW_URL)
    await expect(page.locator(CANVAS_SELECTOR).first()).toBeVisible({ timeout: 15_000 })

    const chatBtn = page.locator(CHAT_BTN_SELECTOR).first()
    await chatBtn.click()
    await expect(page.locator('dialog[open]')).toBeVisible()

    // Wait for suggested questions
    await expect(page.getByText('Ask questions about this architecture element')).toBeVisible()
    await page.waitForTimeout(300)

    const dialog = page.locator('dialog[open]')
    await dialog.screenshot({
      path: resolve(SCREENSHOT_DIR, 'ai-chat-empty-state.png'),
    })
  })

  test('capture conversation with streaming response', async ({ page }) => {
    const responseText = [
      '## Overview\n\n',
      'This element serves as the **primary entry point** for the system. ',
      'It handles user authentication, request routing, and session management.\n\n',
      '### Key Responsibilities\n\n',
      '- Authenticates incoming requests\n',
      '- Routes traffic to downstream services\n',
      '- Manages user sessions and state\n\n',
      '### Dependencies\n\n',
      'It relies on the **Backend API** for data processing ',
      'and **Amazon SQS** for asynchronous message handling.',
    ].join('')

    await page.route('**/chat/completions', async (route) => {
      const chunks = responseText.match(/.{1,40}/g) ?? [responseText]
      const sseBody = chunks
        .map(chunk => `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}`)
        .join('\n\n') + '\n\ndata: [DONE]\n\n'

      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: sseBody,
      })
    })

    await page.goto(VIEW_URL)
    await expect(page.locator(CANVAS_SELECTOR).first()).toBeVisible({ timeout: 15_000 })

    const chatBtn = page.locator(CHAT_BTN_SELECTOR).first()
    await chatBtn.click()
    await expect(page.locator('dialog[open]')).toBeVisible()

    const input = page.getByPlaceholder('Ask about this element...')
    await input.fill('What does this element do and what are its dependencies?')
    await page.getByLabel('Send message').click()

    await expect(page.getByText('Manages user sessions and state')).toBeVisible({ timeout: 5000 })
    await page.waitForTimeout(500)

    const dialog = page.locator('dialog[open]')
    await dialog.screenshot({
      path: resolve(SCREENSHOT_DIR, 'ai-chat-conversation.png'),
    })
  })

  test('capture settings panel', async ({ page }) => {
    const SETTINGS_PROJECT = 'ai-chat-settings'
    await page.goto(`/project/${SETTINGS_PROJECT}/view/index/`)
    await expect(page.locator(CANVAS_SELECTOR).first()).toBeVisible({ timeout: 15_000 })

    const chatBtn = page.locator(CHAT_BTN_SELECTOR).first()
    await chatBtn.click()
    await expect(page.locator('dialog[open]')).toBeVisible()

    // Open settings panel
    await page.getByLabel('Settings').click()
    await expect(page.getByLabel('Base URL')).toBeVisible()
    await page.waitForTimeout(300)

    const dialog = page.locator('dialog[open]')
    await dialog.screenshot({
      path: resolve(SCREENSHOT_DIR, 'ai-chat-settings.png'),
    })
  })

  test('capture reasoning model response', async ({ page }) => {
    const reasoningText = 'Let me analyze this architecture element. I need to consider its role in the system, '
      + 'its relationships with other components, and the technologies involved. '
      + 'The element appears to be a cloud service with several downstream dependencies...'

    const responseText = 'This is the **Cloud** system — the core of the architecture. '
      + 'It contains the UI layer, the next-generation backend, and the legacy backend.\n\n'
      + '**Key concern:** The legacy backend is tightly coupled to the PostgreSQL database, '
      + 'which could become a bottleneck as traffic scales.'

    await page.route('**/chat/completions', async (route) => {
      const reasoningChunks = reasoningText.match(/.{1,50}/g) ?? [reasoningText]
      const contentChunks = responseText.match(/.{1,40}/g) ?? [responseText]

      const sseLines = [
        ...reasoningChunks.map(chunk =>
          `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: chunk } }] })}`
        ),
        ...contentChunks.map(chunk => `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}`),
        'data: [DONE]',
      ]

      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body: sseLines.join('\n\n') + '\n\n',
      })
    })

    await page.goto(VIEW_URL)
    await expect(page.locator(CANVAS_SELECTOR).first()).toBeVisible({ timeout: 15_000 })

    const chatBtn = page.locator(CHAT_BTN_SELECTOR).first()
    await chatBtn.click()
    await expect(page.locator('dialog[open]')).toBeVisible()

    const input = page.getByPlaceholder('Ask about this element...')
    await input.fill('Are there any concerns with this element?')
    await page.getByLabel('Send message').click()

    // Wait for response to finish
    await expect(page.getByText('bottleneck as traffic scales')).toBeVisible({ timeout: 5000 })
    await page.waitForTimeout(500)

    // Expand the collapsed reasoning block
    const reasoningHeader = page.getByText(/Thought for/)
    if (await reasoningHeader.isVisible()) {
      await reasoningHeader.click()
      await page.waitForTimeout(300)
    }

    const dialog = page.locator('dialog[open]')
    await dialog.screenshot({
      path: resolve(SCREENSHOT_DIR, 'ai-chat-reasoning.png'),
    })
  })
})
