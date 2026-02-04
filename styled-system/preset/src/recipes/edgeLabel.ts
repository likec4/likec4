import { defineParts, defineRecipe } from '@pandacss/dev'

const parts = defineParts({
  root: { selector: '&' },
  stepNumber: { selector: '& .likec4-edge-label__step-number' },
  contents: { selector: '& .likec4-edge-label__contents' },
  label: { selector: '& .likec4-edge-label__text' },
  technology: { selector: '& .likec4-edge-label__technology' },
})

export const edgeLabel = defineRecipe({
  className: 'likec4-edge-label',
  jsx: [],
  base: parts({
    root: {
      fontFamily: 'likec4.relation',
      paddingBlock: '1',
      paddingInline: '1.5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: 'max-content',
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
      _only: {
        borderRadius: '4px',
        minWidth: '24px',
      },
      background: `color-mix(in oklab, var(--xy-edge-label-background-color), {colors.likec4.mixColor} 12%)`,
      fontVariantNumeric: 'tabular-nums',
      [':where([data-likec4-color="gray"]) &']: {
        _dark: {
          background: `[color-mix(in oklab, var(--xy-edge-label-background-color), {colors.likec4.mixColor} 15%)]`,
        },
      },
    },
    contents: {
      display: 'contents',
      _empty: {
        display: 'none !important',
      },
    },
    label: {
      whiteSpaceCollapse: 'preserve-breaks',
      fontSize: '14px',
      lineHeight: '1.2',
      margin: '0',
    },
    technology: {
      textAlign: 'center',
      whiteSpaceCollapse: 'preserve-breaks',
      fontSize: '11px',
      lineHeight: '1',
      opacity: 0.75,
    },
  }),
  variants: {
    pointerEvents: {
      none: parts({
        root: {
          pointerEvents: 'none',
        },
      }),
      all: parts({
        root: {
          pointerEvents: 'all',
        },
      }),
    },
    cursor: {
      pointer: parts({
        root: {
          cursor: 'pointer',
        },
      }),
      default: parts({
        root: {
          cursor: 'default',
        },
      }),
    },
    isStepEdge: {
      false: {},
      true: parts({
        root: {
          flexDirection: 'row',
          gap: '1',
          padding: '0',
        },
        contents: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '0.5',
          paddingRight: '1',
          paddingBottom: '1',
          gap: '0.5',
        },
        label: {
          py: '0.5',
          paddingRight: '0.5',
        },
      }),
    },
  },
  defaultVariants: {
    pointerEvents: 'all',
    isStepEdge: false,
    cursor: 'default',
  },
  staticCss: [{
    conditions: ['*'],
    isStepEdge: ['*'],
    cursor: ['*'],
    pointerEvents: ['*'],
  }],
})
