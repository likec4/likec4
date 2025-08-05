import { cva } from '@likec4/styles/css'

export const compoundActionBtn = cva({
  base: {
    transitionDuration: 'normal',
    '[data-compound-title-inverse] &': {
      _dark: {
        '--actionbtn-color': 'color-mix(in srgb, var(--likec4-palette-loContrast) 60%, var(--likec4-palette-fill))',
      },
      _light: {
        '--actionbtn-color': 'var(--likec4-palette-stroke)',
        '--actionbtn-color-hovered': 'var(--likec4-palette-stroke)',
        '--actionbtn-color-hovered-btn': 'var(--likec4-palette-hiContrast)',
        '--actionbtn-bg-hovered': `var(--likec4-palette-fill)/50`,
        '--actionbtn-bg-hovered-btn': `var(--likec4-palette-fill)`,
      },
    },
  },
  variants: {
    delay: {
      true: {
        // Debounce CSS transition
        transitionDelay: {
          base: '0.2s',
          _hover: '0s',
        },
      },
    },
  },
})
