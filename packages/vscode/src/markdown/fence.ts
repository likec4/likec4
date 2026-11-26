/**
 * Parsing of ```likec4-view fenced blocks, aligned with `mkdocs-likec4` 1.2.x syntax.
 */
import type { ColorScheme, DynamicVariant } from '@likec4/vscode-preview/markdown-protocol'

export type { ColorScheme, DynamicVariant }

export const NAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/

export interface FenceOptions {
  browser: boolean
  variant: DynamicVariant
  project: string | undefined
  scheme: ColorScheme
}

export const DEFAULT_OPTIONS: Readonly<FenceOptions> = Object.freeze({
  browser: true,
  variant: 'diagram',
  project: undefined,
  scheme: 'auto',
})

const OPT_BROWSER = /\bbrowser=(true|false)\b/
const OPT_VARIANT = /\bdynamic-variant=(diagram|sequence)\b/
const OPT_PROJECT = /\bproject=(\S+)/
const OPT_COLOR_SCHEME = /\bcolor-scheme=(auto|light|dark)\b/

/**
 * Returns true when the Markdown fence is a backtick-opened `likec4-view` block.
 * Tilde (`~~~`) fences are ignored for parity with `mkdocs-likec4`.
 */
export function isLikeC4Fence(info: string, markup = '```'): boolean {
  if (!markup.startsWith('`')) {
    return false
  }
  return /^likec4-view(\s|$)/.test(info.trim())
}

function optionsText(info: string): string {
  return info.trim().slice('likec4-view'.length).trim()
}

/**
 * Parses `mkdocs-likec4` fence options from a `likec4-view` info string.
 */
export function parseFenceOptions(info: string, defaultScheme: ColorScheme = 'auto'): FenceOptions {
  const text = optionsText(info)
  const opts: FenceOptions = {
    ...DEFAULT_OPTIONS,
    scheme: defaultScheme,
  }

  const browserMatch = OPT_BROWSER.exec(text)
  if (browserMatch) {
    opts.browser = browserMatch[1] === 'true'
  }

  const variantMatch = OPT_VARIANT.exec(text)
  if (variantMatch) {
    opts.variant = variantMatch[1] as DynamicVariant
  }

  const projectMatch = OPT_PROJECT.exec(text)
  if (projectMatch) {
    opts.project = projectMatch[1]
  }

  const schemeMatch = OPT_COLOR_SCHEME.exec(text)
  if (schemeMatch) {
    opts.scheme = schemeMatch[1] as ColorScheme
  }

  return opts
}

export type ViewIdResult =
  | { ok: true; viewId: string }
  | { ok: false; message: string }

/**
 * Extracts the view ID from a `likec4-view` fence body.
 * Requires exactly one line containing the view ID, matching `mkdocs-likec4`.
 */
export function parseViewId(content: string): ViewIdResult {
  const lines = content.replace(/\r?\n$/, '').split(/\r?\n/)
  if (lines.length !== 1) {
    return {
      ok: false,
      message: 'A likec4-view block must contain exactly one line: the view id (as required by mkdocs-likec4).',
    }
  }
  const viewId = lines[0]?.trim() ?? ''
  if (!viewId) {
    return {
      ok: false,
      message: 'Missing view id in likec4-view block.',
    }
  }
  return { ok: true, viewId }
}
