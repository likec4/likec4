import { css } from '@likec4/styles/css'

export const cssHeader = css({
  top: '4',
  right: '4',
  position: 'absolute',
  layerStyle: 'likec4.panel',
  rounded: 'md',
  [`#likec4-root:has([data-likec4-diagram-panning="true"]) &`]: {
    boxShadow: 'none',
    rounded: '0',
  },
  _print: {
    display: 'none',
  },
})
