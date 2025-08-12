import { defineSlotRecipe } from '@pandacss/dev'

export const edgeLabel = defineSlotRecipe({
  className: 'likec4-edge-label',
  slots: ['root', 'stepNumber', 'labelContents', 'labelText', 'labelTechnology'],
  base: {
    root: {
      pointerEvents: 'all',
      fontFamily: 'likec4.relation',
      paddingBlock: '1',
      paddingInline: '1.5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: 'max-content',
      lineHeight: '[1.2]',
      maxWidth: '100%',
      gap: '0.5',
      color: 'var(--xy-edge-label-color)',
      background: 'var(--xy-edge-label-background-color)',
      border: '0px solid transparent',
      borderRadius: '4px',
    },
    stepNumber: {
      alignSelf: 'stretch',
      flex: '0 0 auto',
      fontWeight: 600,
      fontSize: '14px',
      padding: '1',
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
      margin: '0',
    },
    labelTechnology: {
      textAlign: 'center',
      whiteSpaceCollapse: 'preserve-breaks',
      fontSize: '11px',
      lineHeight: '[1]',
      opacity: 0.75,
    },
  },
  variants: {
    cursor: {
      pointer: {
        root: {
          cursor: 'pointer',
        },
      },
      default: {
        root: {
          cursor: 'default',
        },
      },
    },
    isStepEdge: {
      false: {},
      true: {
        root: {
          flexDirection: 'row',
          gap: '1',
          padding: '0',
        },
        labelContents: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '0.5',
          paddingRight: '1',
          paddingBottom: '1',
          gap: '0.5',
        },
        labelText: {
          py: '0.5',
          paddingRight: '0.5',
        },
      },
    },
  },
  defaultVariants: {
    isStepEdge: false,
    cursor: 'default',
  },
  staticCss: [{
    conditions: ['*'],
    isStepEdge: ['*'],
  }],
})
