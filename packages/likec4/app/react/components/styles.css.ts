import { createVar, globalStyle, style } from '@vanilla-extract/css'

export const cssRoot = style({
  margin: 0,
  padding: 0,
  display: 'block',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  backgroundColor: 'unset',
  vars: {
    ['--likec4-default-font-family']:
      `"IBM Plex Sans",ui-sans-serif system-ui, sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"`
    // ['--mantine-font-family']: 'var(--likec4-default-font-family)'
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
        ['--mantine-color-body']: 'rgb(1 1 1 / 25%) !important'
      }
    }
  }
})

globalStyle(`:where(${cssLikeC4Browser}[data-mantine-color-scheme=light] .likec4-compound-transparent)`, {
  vars: {
    ['--_compound-title-color']: 'var(--likec4-compound-title-color)'
  }
})

// globalStyle(`${cssLikeC4Browser} .mantine-Modal-content`, {
//   backgroundColor: 'transparent'
// })

// globalStyle(`${cssLikeC4Browser} .mantine-Modal-body`, {
//   width: '100%',
//   height: '100%',
// })

// globalStyle(`${cssLikeC4Browser} .mantine-CloseButton-root`, {
//   position: 'absolute',
//   zIndex: 1,
//   top: '1rem',
//   right: '1rem',
// })
