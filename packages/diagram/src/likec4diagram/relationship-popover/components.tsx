// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
import type { Color } from '@likec4/core/types'
import { styled } from '@likec4/styles/jsx'
import { txt } from '@likec4/styles/patterns'
import type { PropsWithChildren } from 'react'

export const Endpoint = ({ children, likec4color }: PropsWithChildren<{ likec4color: Color }>) => {
  return (
    <div
      data-likec4-color={likec4color}
      className={txt({
        size: 'xxs',
        fontWeight: 'medium',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '160px',
        paddingX: '1',
        paddingY: '0.5',
        rounded: 'xs',
        background: {
          _light: 'var(--likec4-palette-fill)/90',
          _dark: 'var(--likec4-palette-fill)/60',
        },
        color: {
          _light: 'var(--likec4-palette-hiContrast)',
          _dark: 'var(--likec4-palette-loContrast)',
        },
      })}>
      {children}
    </div>
  )
}

export const RelationshipTitle = styled('div', {
  base: {
    whiteSpaceCollapse: 'preserve-breaks',
    fontSize: 'sm',
    lineHeight: 'sm',
    userSelect: 'all',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
    minWidth: 0,
  },
})
