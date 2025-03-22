import { cva } from '@likec4/styles/css'

export const compoundActionBtn = cva({
  base: {
    transitionDuration: 'normal',
    '[data-compound-title-inverse] &': {
      _dark: {
        '--actionbtn-color': 'color-mix(in srgb, {colors.likec4.palette.loContrast} 60%, {colors.likec4.palette.fill})',
      },
      _light: {
        '--actionbtn-color': '{colors.likec4.palette.stroke}',
        '--actionbtn-color-hovered': '{colors.likec4.palette.stroke}',
        '--actionbtn-color-hovered-btn': '{colors.likec4.palette.hiContrast}',
        '--actionbtn-bg-hovered': `{colors.likec4.palette.fill/50}`,
        '--actionbtn-bg-hovered-btn': `{colors.likec4.palette.fill}`,
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
