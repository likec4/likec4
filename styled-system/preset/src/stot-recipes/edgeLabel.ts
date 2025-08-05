import { defineSlotRecipe } from '@pandacss/dev'

export const edgeLabel = defineSlotRecipe({
  className: 'likec4-edge-label',
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
      gap: '0.5',
      color: 'var(--xy-edge-label-color)',
    },
    stepNumber: {
      alignSelf: 'stretch',
      flex: '0 0 auto',
      fontWeight: 600,
      fontSize: '14px',
      lineHeight: '[1.1]',
      padding: '[5px 5px]',
      textAlign: 'center',
      minWidth: '22px',
      borderTopLeftRadius: '4px',
      borderBottomLeftRadius: '4px',
      background: `[color-mix(in srgb, var(--likec4-palette-relation-label-bg), {colors.likec4.mixColor} 10%)]`,
      fontVariantNumeric: 'tabular-nums',
      // _dark: {
      [':where([data-likec4-color="gray"]) &']: {
        _dark: {
          background: `[color-mix(in srgb, var(--likec4-palette-relation-label-bg), {colors.likec4.mixColor} 15%)]`,
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
      lineHeight: '[1.185]',
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
          gap: '0.5',
          padding: '0',
        },
        labelContents: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '[2px 4px 4px 1px]',
        },
        labelText: {
          // padding: '[2px 4px 4px 1px]',
        },
      },
    },
  },
  defaultVariants: {
    isStepEdge: false,
  },
  staticCss: [{
    conditions: ['*'],
    isStepEdge: ['*'],
  }],
})
