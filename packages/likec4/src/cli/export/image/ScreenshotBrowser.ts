// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov

import type { Browser, BrowserContext, Page } from 'playwright'
import type { ViteLogger } from '../../../logger'
import k from 'tinyrainbow'

export type ScreenshotBrowserOptions = {
  logger: ViteLogger
  theme: 'light' | 'dark'
  /** Default navigation and action timeout of the pages. */
  timeoutMs: number
  /** Enable/disable chromium sandbox (see Playwright docs). */
  chromiumSandbox?: boolean
  /** Launches the browser; defaults to headless Chromium from Playwright. */
  launch?: () => Promise<Browser>
}

/**
 * Owns one headless browser and one browser context shared by all screenshot workers.
 *
 * The browser is launched lazily, on the first {@link ScreenshotBrowser.newPage} call,
 * and closed with `await using` (or {@link ScreenshotBrowser.close}).
 * The context has no base URL: each task brings an absolute URL, so pages can be reused across projects.
 */
export class ScreenshotBrowser implements AsyncDisposable {
  readonly #options: ScreenshotBrowserOptions
  #browser: Promise<{ browser: Browser; context: BrowserContext }> | undefined
  #closed = false

  constructor(options: ScreenshotBrowserOptions) {
    this.#options = options
  }

  /** Creates a new page in the shared context, launching the browser on first use. */
  async newPage(): Promise<Page> {
    if (this.#closed) {
      throw new Error('ScreenshotBrowser is closed')
    }
    this.#browser ??= this.#launch()
    const { context } = await this.#browser
    return await context.newPage()
  }

  /**
   * Closes the page without waiting: a failed page is never reused.
   * With `runBeforeUnload` playwright does not wait for the page to be closed.
   */
  discardPage(page: Page): void {
    page.close({ runBeforeUnload: true }).catch(e => this.#options.logger.error(`failed to close page: ${e}`))
  }

  /** Closes the context and the browser, if it was launched. */
  async close(): Promise<void> {
    if (this.#closed) {
      return
    }
    this.#closed = true
    const launched = this.#browser
    this.#browser = undefined
    if (!launched) {
      return
    }
    const { browser, context } = await launched.catch(() => ({ browser: null, context: null }))
    if (!browser) {
      return
    }
    this.#options.logger.debug?.(k.cyan(`close chromium`))
    await context.close().catch(e => this.#options.logger.error(`failed to close browser context: ${e}`))
    await browser.close().catch(e => this.#options.logger.error(`failed to close browser: ${e}`))
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.close()
  }

  async #launch(): Promise<{ browser: Browser; context: BrowserContext }> {
    const { logger, theme, timeoutMs, chromiumSandbox = false, launch } = this.#options
    let browser: Browser
    if (launch) {
      browser = await launch()
    } else {
      const { chromium } = await import('playwright')
      logger.debug?.(k.cyan('start chromium') + ' ' + k.dim(chromium.executablePath()))
      browser = await chromium.launch({
        chromiumSandbox,
        headless: true,
      })
    }
    try {
      const context = await browser.newContext({
        deviceScaleFactor: 2,
        colorScheme: theme,
        bypassCSP: true,
        ignoreHTTPSErrors: true,
        isMobile: false,
      })
      context.setDefaultNavigationTimeout(timeoutMs)
      context.setDefaultTimeout(timeoutMs)
      return { browser, context }
    } catch (error) {
      await browser.close().catch(() => {})
      throw error
    }
  }
}
