import { css, sva } from '@likec4/styles/css'
import { xyvars } from './xyvars'
// import { xyvars } from '@likec4/styles/vars'
// import { createVar, fallbackVar, globalStyle } from '@vanilla-extract/css'
// import {
//   easings,
//   mantine,
//   transitions,
//   vars,
//   whereLight,
//   whereNotReducedGraphics,
//   xyvars,
// } from '../../../theme-vars'
// import { edgeVars, mixColor } from './edge.css'

const labelBorderRadius = '4px'
const stepEdgeNumber = css({
  alignSelf: 'stretch',
  flex: '0 0 auto',
  fontWeight: 600,
  fontSize: '14px',
  lineHeight: '1',
  padding: '5px 5px',
  textAlign: 'center',
  minWidth: '22px',
  borderTopLeftRadius: labelBorderRadius,
  borderBottomLeftRadius: labelBorderRadius,
  backgroundColor: `[color-mix(in srgb, {colors.likec4.relation.label.bg}, {colors.likec4.mixColor} 5%)]`,
  fontVariantNumeric: 'tabular-nums',
  // selectors: {
  //   [`${whereDark} :where([data-likec4-color="gray"]) &`]: {
  //     backgroundColor: `color-mix(in srgb, ${vars.relation.labelBgColor}, ${mixColor} 15%)`,
  //   },
  //   [`:where([data-edge-active='true'], [data-edge-hovered="true"]) &`]: {
  //     transition: transitions.fast,
  //     backgroundColor: 'transparent',
  //   },
  // },
})

// export const varLabelX = createVar('label-x')
// export const varLabelY = createVar('label-y')

// globalStyle(`${edgeLabel}:has(${stepEdgeNumber}) ${edgeLabelText}`, {
//   padding: '2px 5px 4px 2px',
// })

export const edgeNoteCloseButton = css({
  position: 'absolute',
  top: 4,
  right: 4,
  // zIndex: 9,
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
  ref: 'var(--edge-translate)',
} as const

export const labelsva = sva({
  slots: ['root', 'wrapper', 'stepNumber', 'labelContents', 'labelText', 'labelTechnology'],
  base: {
    root: {
      top: 0,
      left: 0,
      position: 'absolute',
      pointerEvents: 'all',
      cursor: 'pointer',
      width: 'auto',
      height: 'auto',
      background: xyvars.edge.labelBgColor.ref,
      color: '[var(--xy-edge-label-color)]',
      border: '0px solid transparent',
      _notReducedGraphics: {
        borderRadius: labelBorderRadius,
        mixBlendMode: 'plus-lighter',
        transform: translate.ref,
        transition: 'fast',
        _whenHovered: {
          transition: `all 190ms {easings.inOut}`,
          transform: `${translate.ref} scale(1.12)`,
        },
        _light: {
          mixBlendMode: 'screen',
        },
      },
    },
    wrapper: {
      fontFamily: 'likec4.relation',
      padding: '3px 5px 5px 5px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: 'max-content',
      maxWidth: '100%',
      gap: '4px',
    },
    stepNumber: {
      alignSelf: 'stretch',
      flex: '0 0 auto',
      fontWeight: 600,
      fontSize: '14px',
      lineHeight: '1',
      padding: '5px 5px',
      textAlign: 'center',
      minWidth: '22px',
      borderTopLeftRadius: labelBorderRadius,
      borderBottomLeftRadius: labelBorderRadius,
      background: `[color-mix(in srgb, {colors.likec4.relation.label.bg}, {colors.likec4.mixColor} 5%)]`,
      fontVariantNumeric: 'tabular-nums',
      _dark: {
        _likec4ColorGray: {
          background: `[color-mix(in srgb, {colors.likec4.relation.label.bg}, {colors.likec4.mixColor} 15%)]`,
        },
      },
      //  [`${whereDark} :where([data-likec4-color="gray"]) &`]: {
      //     backgroundColor: `color-mix(in srgb, ${vars.relation.labelBgColor}, ${mixColor} 15%)`,
      //   },
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
      // color: xyvars.edge.labelColor.ref,
    },
    labelTechnology: {
      // color: xyvars.edge.labelColor.ref,
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
        wrapper: {
          flexDirection: 'row',
          padding: '0',
          gap: '0',
        },
        labelText: {
          padding: '2px 5px 4px 2px',
        },
      },
    },
  },
  defaultVariants: {
    isStepEdge: false,
  },
})
