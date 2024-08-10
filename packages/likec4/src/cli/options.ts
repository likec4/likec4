import { resolve } from 'node:path'
import type { Options, PositionalOptions } from 'yargs'

export const path = {
  type: 'string',
  description: '<directory> with LikeC4 sources (default is current directory)',
  desc: '<directory> with LikeC4 sources (default is current directory)',
  normalize: true,
  default: '.',
  coerce: resolve
} as const satisfies PositionalOptions

export const useDotBin = {
  alias: 'use-dot-bin',
  boolean: true,
  type: 'boolean',
  description: 'use local binaries of graphviz ("dot")',
  desc: 'use local binaries of graphviz ("dot")',
  default: false
} as const satisfies Options

export const useHashHistory = {
  boolean: true,
  type: 'boolean',
  desc: 'hash history, e.g. "/#/view" instead of "/view"'
} as const satisfies Options

export const outdir = {
  alias: 'o',
  type: 'string',
  desc: '<directory> output directory',
  normalize: true,
  coerce: resolve
} as const satisfies Options

export const webcomponentPrefix = {
  alias: 'w',
  type: 'string',
  desc: 'prefix for webcomponents, e.g "c4" generates <c4-view ../>',
  default: 'likec4'
} as const satisfies Options

export const base = {
  alias: ['base-url'],
  type: 'string',
  desc: 'base url the app is being served from, e.g. "/" or "/pages/"'
} as const satisfies Options
