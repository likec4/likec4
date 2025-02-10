import { defaultTheme } from '@likec4/core'
import { rem } from '@mantine/core'
import { createGlobalVar, createVar, globalStyle } from '@vanilla-extract/css'
import { container } from './ElementNodeContainer.css'

export const textSize = createVar('text-size')
export const paddingSize = createVar('padding-size')
export const iconSize = createGlobalVar('likec4-icon-size')

globalStyle(`${container}`, {
  vars: {
    [textSize]: rem(defaultTheme.textSizes.md),
    [paddingSize]: rem(defaultTheme.spacing.md),
    [iconSize]: '60px',
  },
})

globalStyle(`${container}[data-likec4-shape-size="xs"]`, {
  vars: {
    [iconSize]: '24px',
  },
})
globalStyle(`${container}[data-likec4-shape-size="sm"]`, {
  vars: {
    [iconSize]: '36px',
  },
})
globalStyle(`${container}[data-likec4-shape-size="lg"]`, {
  vars: {
    [iconSize]: '82px',
  },
})
globalStyle(`${container}[data-likec4-shape-size="xl"]`, {
  vars: {
    [iconSize]: '90px',
  },
})

const sizes = ['xs', 'sm', 'lg', 'xl'] as const
sizes.forEach((size) => {
  globalStyle(`${container}[data-likec4-text-size="${size}"]`, {
    vars: {
      [textSize]: rem(defaultTheme.textSizes[size]),
    },
  })

  globalStyle(`${container}[data-likec4-padding="${size}"]`, {
    vars: {
      [paddingSize]: rem(defaultTheme.spacing[size]),
    },
  })
})
