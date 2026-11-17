// SPDX-License-Identifier: MIT

/**
 * Notation (legend) of images from **Copy as PNG** and **Save as PNG**,
 * from the `likec4.export.notation.*` settings.
 */
export type PngExportNotation = {
  enabled: boolean
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  text: 'short' | 'full' | 'kind'
}

/**
 * Arguments of `likec4 export png` for the notation.
 * Position and text are always passed with `--notation`: CLIs from before these options ignore them.
 */
export function pngExportNotationArgs(notation: PngExportNotation | undefined): string[] {
  if (!notation?.enabled) {
    return []
  }
  return ['--notation', '--notation-position', notation.position, '--notation-text', notation.text]
}
