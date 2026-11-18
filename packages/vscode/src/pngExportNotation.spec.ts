// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest'
import { pngExportNotationArgs } from './pngExportNotation'

describe('pngExportNotationArgs', () => {
  it('adds nothing when the notation is off or not configured', () => {
    expect(pngExportNotationArgs(undefined)).toEqual([])
    expect(pngExportNotationArgs({ enabled: false, position: 'top-left', text: 'full' })).toEqual([])
  })

  it('passes the notation with its position and text', () => {
    expect(pngExportNotationArgs({ enabled: true, position: 'bottom-right', text: 'short' })).toEqual([
      '--notation',
      '--notation-position',
      'bottom-right',
      '--notation-text',
      'short',
    ])
    expect(pngExportNotationArgs({ enabled: true, position: 'top-left', text: 'kind' })).toEqual([
      '--notation',
      '--notation-position',
      'top-left',
      '--notation-text',
      'kind',
    ])
  })
})
