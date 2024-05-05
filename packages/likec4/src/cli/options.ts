import { resolve } from 'node:path'
import type { Options, PositionalOptions } from 'yargs'

export const path = {
  type: 'string',
  desc: '<directory> with LikeC4 source files (by default current directory)',
  normalize: true,
  default: '.',
  coerce: resolve
} as const satisfies PositionalOptions

export const useDotBin = {
  boolean: true,
  type: 'boolean',
  desc: 'use local binaries of graphviz ("dot") instead of wasm',
  default: false
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
  type: 'string',
  desc: 'base url the app is being served from, e.g. "/" or "/pages/"'
} as const satisfies Options
