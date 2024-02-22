export const useDotBin = {
  boolean: true,
  type: 'boolean',
  desc: 'If true, the layouter will use the binary version of graphviz.\nBy default, it uses the wasm version.',
  default: false
} as const

export const outdir = {
  alias: 'o',
  type: 'string',
  desc: '<directory> output directory',
  normalize: true
} as const
