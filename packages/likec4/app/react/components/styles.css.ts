import { globalStyle, style } from '@vanilla-extract/css'

export const shadowRoot = style({
  margin: 0,
  padding: 0,
  display: 'block',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  backgroundColor: 'transparent',
  vars: {
    ['--likec4-default-font-family']:
      `"IBM Plex Sans",ui-sans-serif system-ui, sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"`
    // ['--mantine-font-family']: 'var(--likec4-default-font-family)'
  }
})

export const cssLikeC4View = style({})

export const cssInteractive = style({
  cursor: 'pointer',
  vars: {
    ['--mantine-cursor-pointer']: 'pointer'
  }
})

globalStyle(`${cssInteractive} :where(.likec4-diagram, .likec4-compound-node, .likec4-element-node)`, {
  cursor: 'pointer'
})

export const cssLikeC4Browser = style({})
