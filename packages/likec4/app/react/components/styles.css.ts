import { css } from '@likec4/styles/css'

export const shadowRoot = css({
  margin: 0,
  padding: 0,
  display: 'block',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  backgroundColor: 'transparent',
  position: 'relative',

  ['--likec4-default-font-family']:
    `"IBM Plex Sans",ui-sans-serif system-ui, sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"`,
  // ['--mantine-font-family']: 'var(--likec4-default-font-family)'
})

export const cssLikeC4View = css({})

export const cssInteractive = css({
  cursor: 'pointer',
  ['--mantine-cursor-pointer']: 'pointer',
  '& :where(.likec4-diagram, .likec4-compound-node, .likec4-element-node)': {
    cursor: 'pointer',
  },
})

export const cssLikeC4Browser = css({})

export const browserOverlay = css({
  inset: '2rem',
})
