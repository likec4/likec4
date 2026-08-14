// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'
import { CANVAS_SELECTOR } from '../helpers/selectors'
import { TIMEOUT_CANVAS } from '../helpers/timeouts'

const WEBCOMPONENT_BUNDLE = '/likec4-views.js'
const WEBCOMPONENT_PREVIEW = '/webcomponent/index'
const SHADOW_ROOT_SELECTOR = '.likec4-shadow-root'
const TRANSPARENT_BACKGROUND = 'rgba(0, 0, 0, 0)'

async function waitForWebcomponentBundle(page: Page): Promise<void> {
  await expect.poll(
    async () => {
      const response = await page.request.get(WEBCOMPONENT_BUNDLE, {
        failOnStatusCode: false,
      })
      return response.status()
    },
    {
      timeout: 60_000,
      message: `${WEBCOMPONENT_BUNDLE} should be available after the background webcomponent build`,
    },
  ).toBe(200)
}

test('webcomponent expanded overlay uses the shadow-root theme background (#2965)', async ({ page }) => {
  test.setTimeout(75_000)

  await waitForWebcomponentBundle(page)
  await page.goto(WEBCOMPONENT_PREVIEW)

  const frame = page.frameLocator('iframe')
  await expect(frame.locator(CANVAS_SELECTOR).first()).toBeVisible({ timeout: TIMEOUT_CANVAS })

  const shadowRoot = frame.locator(SHADOW_ROOT_SELECTOR).first()
  await expect(shadowRoot).toBeVisible({ timeout: TIMEOUT_CANVAS })

  const styleProbe = await shadowRoot.evaluate(element => {
    const root = element.getRootNode()
    if (!(root instanceof ShadowRoot)) {
      return {
        hasScopedRootSelector: false,
        hasUnscopedRootHostSelector: false,
      }
    }
    const bundledStyles = root.adoptedStyleSheets
      .flatMap(sheet => [...sheet.cssRules].map(rule => rule.cssText))
      .join('\n')
    return {
      hasScopedRootSelector: bundledStyles.includes(':where(.likec4-shadow-root)'),
      hasUnscopedRootHostSelector: /:where\(:root,\s*:host\)/.test(bundledStyles),
    }
  })
  expect(styleProbe).toEqual({
    hasScopedRootSelector: true,
    hasUnscopedRootHostSelector: false,
  })

  await frame.locator('.react-flow__node').first().click()

  const overlayBody = frame.locator('dialog[open] .likec4-overlay-body').first()
  await expect(overlayBody).toBeVisible({ timeout: TIMEOUT_CANVAS })

  await expect.poll(
    async () => {
      return overlayBody.evaluate(element => getComputedStyle(element).backgroundColor)
    },
    {
      timeout: 5_000,
      message: 'expanded embedded overlay body should resolve a non-transparent background color',
    },
  ).not.toBe(TRANSPARENT_BACKGROUND)

  await expect.poll(
    async () => {
      return overlayBody.evaluate(element =>
        getComputedStyle(element).getPropertyValue('--colors-likec4-overlay-body').trim()
      )
    },
    {
      timeout: 5_000,
      message: 'overlay background theme variable should be scoped into the embedded shadow root',
    },
  ).not.toBe('')
})
