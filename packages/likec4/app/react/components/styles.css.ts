import { rem } from '@mantine/core'
import { createVar, globalStyle, style } from '@vanilla-extract/css'

var fontFamily = createVar()

export const cssRoot = style({
  margin: 0,
  padding: 0,
  display: 'block',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  backgroundColor: 'unset',
  vars: {
    [fontFamily]:
      `"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"`,
    ['--likec4-default-font-family']: fontFamily,
    ['--mantine-font-family']: fontFamily
  }
})

export const cssLikeC4View = style({
  backgroundColor: 'unset'
})

export const cssInteractive = style({
  cursor: 'pointer',
  vars: {
    ['--mantine-cursor-pointer']: 'pointer'
  }
})

globalStyle(`${cssInteractive} :where(.likec4-diagram, .likec4-compound-node, .likec4-element-node)`, {
  cursor: 'pointer'
})

export const cssLikeC4Browser = style({
  selectors: {
    ['&[data-mantine-color-scheme]']: {
      backdropFilter: 'blur(20px)',
      vars: {
        ['--mantine-color-body']: 'rgb(0 0 0 / 0%);'
      }
    },
    ['&[data-mantine-color-scheme=light]']: {
      vars: {
        ['--mantine-color-body']: 'rgb(255 255 255 / 35%) !important'
      }
    },
    ['&[data-mantine-color-scheme=dark]']: {
      vars: {
        ['--mantine-color-body']: 'rgb(12 12 12 / 35%) !important'
      }
    }
  }
})

globalStyle(`${cssLikeC4Browser} .mantine-CloseButton-root`, {
  position: 'absolute',
  zIndex: 1,
  top: rem(10),
  right: rem(10)
})
globalStyle(`${cssLikeC4Browser} .mantine-Modal-content`, {
  backgroundColor: 'transparent'
})
