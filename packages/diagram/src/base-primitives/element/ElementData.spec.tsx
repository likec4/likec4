// SPDX-License-Identifier: MIT
//
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

import type { ComputedNodeStyle, NodeId } from '@likec4/core'
import type { Color } from '@likec4/core/types'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ElementData } from './ElementData'

function renderElementData(icon: string | null | undefined, style: ComputedNodeStyle = {}) {
  return renderToStaticMarkup(
    <ElementData
      data={{
        id: 'test' as NodeId,
        title: 'Test',
        color: 'blue' as Color,
        style,
        ...(icon !== undefined && { icon }),
      }}
    />,
  )
}

describe('ElementData icon blending', () => {
  it('does not add the blending recipe variant for brand, provider, and image icons', () => {
    const icons = [
      'tech:postgresql',
      'tech:react',
      'aws:lambda',
      'azure:virtual-machine',
      'gcp:cloud-run',
      'https://example.com/icon.svg',
      'data:image/svg+xml,%3Csvg%3E%3C/svg%3E',
      'file:///tmp/icon.svg',
      'none',
      null,
      undefined,
    ]

    for (const icon of icons) {
      const html = renderElementData(icon)

      expect(html).toContain('likec4-element-node-data--withIconBlend_false')
      expect(html).not.toContain('likec4-element-node-data--withIconBlend_true')
    }
  })

  it('adds the blending recipe variant for bootstrap icons without explicit iconColor', () => {
    expect(renderElementData('bootstrap:house')).toContain('likec4-element-node-data--withIconBlend_true')

    const html = renderElementData('bootstrap:house', { iconColor: 'indigo' })

    expect(html).toContain('likec4-element-node-data--withIconColor_true')
    expect(html).toContain('likec4-element-node-data--withIconBlend_false')
    expect(html).toContain('--likec4-icon-color:')
  })
})
