import { defaultTheme } from '@likec4/core'
import { rem } from '@mantine/core'
import { createVar, globalStyle } from '@vanilla-extract/css'
import { container } from './ElementNodeContainer.css'

export const textSize = createVar('text-size')
export const paddingSize = createVar('padding-size')
export const iconSize = createVar('icon-size')

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
globalStyle(`${container}[data-likec4-shape-size="lg"], ${container}[data-likec4-shape-size="xl"]`, {
  vars: {
    [iconSize]: '82px',
  },
})

globalStyle(`${container}[data-likec4-text-size="xs"]`, {
  vars: {
    [textSize]: rem(defaultTheme.textSizes.xs),
  },
})
globalStyle(`${container}[data-likec4-text-size="sm"]`, {
  vars: {
    [textSize]: rem(defaultTheme.textSizes.sm),
  },
})
globalStyle(`${container}[data-likec4-text-size="lg"]`, {
  vars: {
    [textSize]: rem(defaultTheme.textSizes.lg),
  },
})
globalStyle(`${container}[data-likec4-text-size="xl"]`, {
  vars: {
    [textSize]: rem(defaultTheme.textSizes.xl),
  },
})

globalStyle(`${container}[data-likec4-padding="xs"]`, {
  vars: {
    [paddingSize]: rem(defaultTheme.spacing.xs),
  },
})
globalStyle(`${container}[data-likec4-padding="sm"]`, {
  vars: {
    [paddingSize]: rem(defaultTheme.spacing.sm),
  },
})
globalStyle(`${container}[data-likec4-padding="lg"]`, {
  vars: {
    [paddingSize]: rem(defaultTheme.spacing.lg),
  },
})
globalStyle(`${container}[data-likec4-padding="xl"]`, {
  vars: {
    [paddingSize]: rem(defaultTheme.spacing.xl),
  },
})
