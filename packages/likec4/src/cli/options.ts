import isInsideContainer from 'is-inside-container'
import { resolve } from 'node:path'
import type { Options, PositionalOptions } from 'yargs'

export const path = {
  type: 'string',
  desc: '<directory> with LikeC4 sources (default is current directory)',
  normalize: true,
  default: '.',
  coerce: resolve,
} as const satisfies PositionalOptions

export const useDotBin = {
  alias: 'use-dot-bin',
  boolean: true,
  type: 'boolean',
  desc: isInsideContainer()
    ? 'enabled in container, disable by --no-use-dot'
    : 'use graphviz binaries ("dot" should be on PATH)',
  default: isInsideContainer(),
} as const satisfies Options

export const useCorePackage = {
  boolean: true,
  type: 'boolean',
  desc: 'use `@likec4/core` package in types',
  default: false,
} as const satisfies Options

export const useHashHistory = {
  boolean: true,
  type: 'boolean',
  desc: 'use hash history for navigation, e.g. "/#/view" instead of "/view"',
} as const satisfies Options

export const outdir = {
  alias: 'o',
  type: 'string',
  desc: 'output directory',
  normalize: true,
  nargs: 1,
  coerce: resolve,
} as const satisfies Options

export const webcomponentPrefix = {
  alias: 'w',
  type: 'string',
  desc: 'prefix for Webcomponents, e.g "c4" generates <c4-view ../>',
  default: 'likec4',
  nargs: 1,
} as const satisfies Options

export const title = {
  alias: 't',
  type: 'string',
  desc: 'base title of the app pages (default is "LikeC4")',
  default: 'LikeC4',
  nargs: 1,
} as const satisfies Options

export const base = {
  alias: ['base-url'],
  type: 'string',
  desc: 'base url the app is being served from, e.g. "/" or "/pages/"',
  nargs: 1,
} as const satisfies Options

export const useOverview = {
  boolean: true,
  type: 'boolean',
  desc: 'overview all diagrams as graph [experimental]',
  default: false,
} as const satisfies Options

export const outputSingleFile = {
  boolean: true,
  type: 'boolean',
  desc: 'outputs a single self-contained HTML file with all required resources inlined',
} as const satisfies Options

export const listen = {
  alias: 'l',
  type: 'string',
  desc: isInsideContainer()
    ? 'listen 0.0.0.0 by default in container'
    : 'ip address of the network interface to listen on',
  default: isInsideContainer() ? '0.0.0.0' : 'localhost',
  nargs: 1,
} as const satisfies Options

export const project = {
  alias: 'p',
  type: 'string',
  desc: 'LikeC4 project, name eg. "my-project" or path to the project folder',
  nargs: 1,
} as const satisfies Options
