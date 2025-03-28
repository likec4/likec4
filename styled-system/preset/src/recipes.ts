import { defineRecipe } from '@pandacss/dev'

export const actionBtn = defineRecipe({
  className: 'action-btn',
  description: 'The styles for the Action Buttons',
  base: {
    pointerEvents: 'all',
    cursor: 'pointer',
    color: 'var(--actionbtn-color)',
    opacity: 0.75,

    '--actionbtn-color': '{colors.likec4.palette.loContrast}',
    '--actionbtn-color-hovered': '{colors.likec4.palette.loContrast}',
    '--actionbtn-color-hovered-btn': '{colors.likec4.palette.hiContrast}',

    '--actionbtn-bg-idle': `color-mix(in srgb , {colors.likec4.palette.fill},  transparent 99%)`,
    '--actionbtn-bg-hovered': `color-mix(in srgb , {colors.likec4.palette.fill} 65%, {colors.likec4.palette.stroke})`,
    '--actionbtn-bg-hovered-btn':
      `color-mix(in srgb , {colors.likec4.palette.fill} 50%, {colors.likec4.palette.stroke})`,

    '--ai-bg': `var(--actionbtn-bg-idle)`,

    background: `var(--ai-bg)`,

    _whenHovered: {
      opacity: 1,
      color: 'var(--actionbtn-color-hovered)',
      '--ai-bg': `var(--actionbtn-bg-hovered)`,
    },
    _hover: {
      color: 'var(--actionbtn-color-hovered-btn)',
      '--ai-bg': `var(--actionbtn-bg-hovered-btn)`,
    },
    _reduceGraphicsOnPan: {
      display: 'none',
    },
    _smallZoom: {
      display: 'none',
    },
  },

  variants: {
    variant: {
      transparent: {
        '--actionbtn-bg-hovered': `var(--actionbtn-bg-idle)`,
      },
      filled: {
        boxShadow: {
          base: '1px 1px 3px 0px transparent',
          _whenHovered: '1px 1px 3px 0px rgba(0, 0, 0, 0.2)',
          _reduceGraphics: 'none',
        },
      },
    },
    size: {
      sm: {
        ['--ai-size']: `var(--ai-size-sm)`,
      },
      md: {
        ['--ai-size']: `var(--ai-size-md)`,
      },
    },
    radius: {
      sm: { '--ai-radius': `var(--mantine-radius-sm)` },
      md: { '--ai-radius': `var(--mantine-radius-md)` },
    },
  },
  defaultVariants: {
    size: 'md',
    radius: 'md',
    variant: 'filled',
  },
  staticCss: [{
    size: ['md'],
    radius: ['md'],
    variant: ['*'],
    conditions: ['whenHovered', 'hover', 'reducedGraphics'],
  }],
})
