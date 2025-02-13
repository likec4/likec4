import { resolve } from 'node:path'
import type { Options, PositionalOptions } from 'yargs'

export const path = {
  type: 'string',
  desc: '<directory> with LikeC4 sources (default is current directory)',
  normalize: true,
  default: '.',
  coerce: resolve
} as const satisfies PositionalOptions

export const useDotBin = {
  alias: 'use-dot-bin',
  boolean: true,
  type: 'boolean',
  desc: 'use graphviz binaries ("dot" should be on PATH)',
  default: false
} as const satisfies Options

export const useHashHistory = {
  boolean: true,
  type: 'boolean',
  desc: 'use hash history for navigation, e.g. "/#/view" instead of "/view"'
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
  desc: 'prefix for Webcomponents, e.g "c4" generates <c4-view ../>',
  default: 'likec4'
} as const satisfies Options

export const base = {
  alias: ['base-url'],
  type: 'string',
  desc: 'base url the app is being served from, e.g. "/" or "/pages/"'
} as const satisfies Options

export const useOverview = {
  boolean: true,
  type: 'boolean',
  desc: 'overview all diagrams as graph [experimental]',
  default: false
} as const satisfies Options

export const outputSingleFile = {
  boolean: true,
  type: 'boolean',
  desc: 'outputs a single self-contained HTML file with all required resources inlined'
} as const satisfies Options

export const listen = {
  alias: 'l',
  type: 'string',
  desc: 'ip address of the network interface to listen on',
  default: '127.0.0.1'
} as const satisfies Options