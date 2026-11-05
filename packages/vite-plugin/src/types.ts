// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { LikeC4LanguageServices } from '@likec4/language-services'
import type { AnyTextAdapter } from '@tanstack/ai'

export interface AIOptions<TAdapter extends AnyTextAdapter = AnyTextAdapter> {
  /**
   * The AI adapter to use
   *
   * @see https://tanstack.com/ai/latest/docs/getting-started/overview#adapters
   * @example
   * ```ts
   * import { openRouterText } from '@tanstack/ai-openrouter'
   *
   * export default defineConfig({
   *   plugins: [
   *     likec4VitePlugin({
   *       ai: {
   *         adapter: openRouterText("openai/gpt-5")
   *       },
   *     }),
   *   ],
   * })
   * ```
   */
  adapter: TAdapter
  /** Model-specific provider options (type comes from adapter) */
  modelOptions?: TAdapter['~types']['providerOptions']
  maxTokens?: number
}

export type LikeC4WorkspaceOptions = {
  /**
   * Initialize LikeC4 from the specified workspace path.
   * If not provided, vite project root will be used.
   *
   * As alternative you can provide {@link LikeC4LanguageServices} instance via `languageServices` option.
   */
  workspace?: string
  /**
   * By default, if LikeC4 model is invalid, errors are printed to the console.
   * Disable this behavior by setting this option to false.
   *
   * @default true
   */
  printErrors?: boolean
  /**
   * If true, initialization will return rejected promise with the LikeC4 instance.
   * Use `likec4.getErrors()` to get the errors.
   * @default false
   */
  throwIfInvalid?: boolean
  /**
   * Whether to use the `dot` binary for layouting or the WebAssembly version.
   * @default 'wasm'
   */
  graphviz?: 'wasm' | 'binary'

  /**
   * Whether to watch for changes in the workspace.
   * @default true if vite mode is 'development', false otherwise
   */
  watch?: boolean

  /**
   * The log level to use.
   * @default 'warning'
   */
  logLevel?: 'trace' | 'debug' | 'info' | 'warning' | 'error' | undefined

  /**
   * Either provide path to {@link LikeC4WorkspaceOptions.workspace} or {@link LikeC4LanguageServices} instance.
   */
  languageServices?: never
} | {
  /**
   * If you have instance of {@link LikeC4LanguageServices}, pass it directly.
   * None of the options below are applied when this option is used.
   */
  languageServices: LikeC4LanguageServices
  workspace?: never
  printErrors?: never
  throwIfInvalid?: never
  graphviz?: never
  watch?: never
  logLevel?: never
}

/**
 * Configuration for the LikeC4 application, that is built with Vite or CLI
 */
export interface LikeC4AppConfig {
  /**
   * Webcomponent prefix for likec4 webcomponents
   * @default 'likec4'
   */
  webcomponentPrefix?: string
  /**
   * Page title for the application
   * @default 'LikeC4'
   */
  pageTitle?: string
  /**
   * Whether to use hash history for the application
   * @default false
   */
  useHashHistory?: boolean | undefined
  /**
   * Default color scheme for the application
   * @default 'auto'
   */
  theme?: 'light' | 'dark' | undefined
}

/**
 * Configuration for the LikeC4 Vite plugin
 *
 * @see {@link LikeC4WorkspaceOptions} for workspace options (language services)
 * @see {@link LikeC4AppConfig} for application-specific options
 */
export type LikeC4VitePluginOptions =
  & LikeC4WorkspaceOptions
  & {
    /**
     * AI configuration, by default enabled with automatic detection based on environment variables.
     * You can also provide explicit configuration.
     * Or set to `disabled` to disable AI.
     *
     * @default 'auto' (automatic detection based on environment variables)
     *
     * @see https://tanstack.com/ai/latest/docs/getting-started/overview#adapters
     * @example
     * ```ts
     * import { openRouterText } from '@tanstack/ai-openrouter'
     *
     * export default defineConfig({
     *   plugins: [
     *     likec4VitePlugin({
     *       ai: {
     *         adapter: openRouterText("openai/gpt-5")
     *       },
     *     }),
     *   ],
     * })
     * ```
     */
    ai?: 'disabled' | 'auto' | AIOptions | undefined

    /**
     * Define vite environments where this plugin should be active
     * By default, the plugin is active in all environments
     */
    environments?: string | string[]

    /**
     * Configuration for the LikeC4 application, that is built with Vite or CLI
     */
    appConfig?: LikeC4AppConfig | undefined
  }
