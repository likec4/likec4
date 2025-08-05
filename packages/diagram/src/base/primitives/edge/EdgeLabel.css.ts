import { css, sva } from '@likec4/styles/css'

const labelBorderRadius = '4px'

export const edgeNoteCloseButton = css({
  position: 'absolute',
  top: '1',
  right: '1',
})

export const edgeNoteText = css({
  userSelect: 'all',
  textAlign: 'left',
  whiteSpaceCollapse: 'preserve-breaks',
  textWrap: 'pretty',
  lineHeight: '1.25',
  '--text-fz': '{fontSizes.sm}',
  md: {
    '--text-fz': '{fontSizes.md}',
  },
})

export const translate = {
  var: '--edge-translate',
  ref: `var(--edge-translate)`,
} as const

export const edgeLabelContainer = css({
  top: '0',
  left: '0',
  position: 'absolute',
  pointerEvents: 'all',
  cursor: 'pointer',
  width: 'auto',
  height: 'auto',
  background: '[var(--xy-edge-label-background-color)]',
  color: '[var(--xy-edge-label-color)]',
  border: '0px solid transparent',

  borderRadius: labelBorderRadius,

  transform: `${translate.ref}`,
  transition: 'fast',

  '&:is([data-likec4-hovered=\'true\'])': {
    transition: `all 190ms {easings.inOut}`,
    transform: `var(--edge-translate, translate(0px, 0px)) scale(1.12)`,
    transitionDelay: '100ms',
  },

  _noReduceGraphics: {
    mixBlendMode: {
      _dark: 'plus-lighter',
      _light: 'screen',
    },
  },

  _smallZoom: {
    display: 'none',
  },
  _reduceGraphicsOnPan: {
    display: 'none',
  },
})
