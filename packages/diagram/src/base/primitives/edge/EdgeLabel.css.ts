import { css, sva } from '@likec4/styles/css'

const labelBorderRadius = '4px'

export const edgeNoteCloseButton = css({
  position: 'absolute',
  top: '[4px]',
  right: '[4px]',
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

export const labelsva = sva({
  slots: ['root', 'stepNumber', 'labelContents', 'labelText', 'labelTechnology'],
  base: {
    root: {
      pointerEvents: 'all',
      fontFamily: 'likec4.relation',
      padding: '[3px 5px 5px 5px]',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: 'max-content',
      maxWidth: '100%',
      gap: '[2px]',
    },
    stepNumber: {
      alignSelf: 'stretch',
      flex: '0 0 auto',
      fontWeight: 600,
      fontSize: '14px',
      lineHeight: '1',
      padding: '[5px 5px]',
      textAlign: 'center',
      minWidth: '22px',
      borderTopLeftRadius: labelBorderRadius,
      borderBottomLeftRadius: labelBorderRadius,
      background: `[color-mix(in srgb, {colors.likec4.relation.label.bg}, {colors.likec4.mixColor} 10%)]`,
      fontVariantNumeric: 'tabular-nums',
      // _dark: {
      [':where([data-likec4-color="gray"]) &']: {
        _dark: {
          background: `[color-mix(in srgb, {colors.likec4.relation.label.bg}, {colors.likec4.mixColor} 15%)]`,
        },
      },
    },
    labelContents: {
      display: 'contents',
      _empty: {
        display: 'none !important',
      },
    },
    labelText: {
      whiteSpaceCollapse: 'preserve-breaks',
      fontSize: '14px',
      lineHeight: '1.185',
    },
    labelTechnology: {
      textAlign: 'center',
      whiteSpaceCollapse: 'preserve-breaks',
      fontSize: '11px',
      lineHeight: '1',
      opacity: 0.75,
    },
  },
  variants: {
    isStepEdge: {
      false: {},
      true: {
        root: {
          flexDirection: 'row',
          gap: '[2px]',
          padding: '0',
        },
        labelContents: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '[2px 5px 4px 0px]',
        },
        labelText: {
          padding: '[2px 6px 4px 0px]',
        },
      },
    },
  },
  defaultVariants: {
    isStepEdge: false,
  },
})
