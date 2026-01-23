import { defineParts, defineRecipe } from '@pandacss/dev'

const backdropBlur = '--_blur'
const backdropOpacity = '--_opacity'

const level = '--_level'
const offset = '--_offset'
const inset = '--_inset'

const borderRadius = '--_border-radius'

const parts = defineParts({
  dialog: { selector: '&' },
  body: { selector: '& .likec4-overlay-body' },
})

export const overlay = defineRecipe({
  description: 'Recipe for Overlay Dialog',
  className: 'likec4-overlay',
  base: parts({
    dialog: {
      boxSizing: 'border-box',
      margin: '0',
      position: 'fixed',
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      background: `likec4.overlay.border`,
      shadow: 'xl',
      border: 'transparent',
      outline: 'none',
      borderRadius: `var(${borderRadius})`,
      [backdropBlur]: '0px',
      [level]: '0',
      [offset]: '0px',
      [inset]: 'calc((1 + var(--_level) * 0.75) * var(--_offset))',
      [backdropOpacity]: '0%',
      [borderRadius]: '0px',
      _backdrop: {
        cursor: 'zoom-out',
      },
      inset: '0',
      padding: '0',
    },
    body: {
      position: 'relative',
      containerName: 'likec4-dialog',
      containerType: 'size',
      border: `transparent`,
      overflow: 'hidden',
      width: '100%',
      height: '100%',
      background: 'likec4.overlay.body',
    },
  }),
  variants: {
    fullscreen: {
      false: {
        dialog: {
          sm: {
            inset: '[var(--_inset) var(--_inset) var(--_offset) var(--_inset)]',
            width: 'calc(100vw - 2 * var(--_inset))',
            height: 'calc(100vh - var(--_offset) - var(--_inset))',
            [borderRadius]: '6px',
            padding: '1.5', // 6px
            [offset]: '{spacing.4}',
          },
          md: {
            [offset]: '{spacing.4}',
          },
          lg: {
            [offset]: '{spacing.8}',
          },
          xl: {
            [offset]: '{spacing.16}',
          },
        },
        body: {
          sm: {
            borderRadius: `calc(var(${borderRadius}) - 2px)`,
          },
        },
      },
      true: {
        dialog: {
          inset: '0',
          padding: '0',
        },
      },
    },
    withBackdrop: {
      false: {
        dialog: {
          _backdrop: {
            display: 'none',
          },
        },
      },
      true: {
        dialog: {
          _backdrop: {
            backdropFilter: `blur(var(${backdropBlur}))`,
            background: `color-mix(in oklab, {colors.likec4.overlay.backdrop} var(${backdropOpacity}), transparent)`,
          },
        },
      },
    },
  },
  defaultVariants: {
    fullscreen: false,
    withBackdrop: true,
  },
  staticCss: [{
    fullscreen: ['*'],
  }, {
    withBackdrop: ['*'],
  }],
})
