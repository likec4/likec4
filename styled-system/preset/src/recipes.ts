import { defineRecipe } from '@pandacss/dev'

export const actionBtn = defineRecipe({
  className: 'action-btn',
  description: 'The styles for the Action Buttons',
  base: {
    // colorPalette: 'var(--likec4-palette)',
    pointerEvents: 'all',
    cursor: 'pointer',
    color: 'likec4.palette.loContrast',
    opacity: 0.75,
    // '--_color': '{colors.colorPalette.loContrast}',
    '--_idle': `color-mix(in srgb , {colors.likec4.palette.fill},  transparent 99%)`,
    '--_node-hovered': `color-mix(in srgb , {colors.likec4.palette.fill} 65%, {colors.likec4.palette.stroke})`,
    '--_btn-hovered': `color-mix(in srgb , {colors.likec4.palette.fill} 50%, {colors.likec4.palette.stroke})`,

    '--ai-bg': `var(--_idle)`,
    background: `var(--ai-bg)`,
    boxShadow: '1px 1px 3px 0px transparent',
    _whenHovered: {
      opacity: 1,
      '--ai-bg': `var(--_node-hovered)`,
    },
    _hover: {
      color: 'likec4.palette.hiContrast',
      '--ai-bg': `var(--_btn-hovered)`,
    },
    _reducedGraphics: {
      boxShadow: 'none',
    },
  },

  variants: {
    variant: {
      transparent: {
        '--_node-hovered': `var(--_idle)`,
      },
      filled: {
        _whenHovered: {
          boxShadow: '1px 1px 3px 0px rgba(0, 0, 0, 0.2)',
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
      xs: { '--ai-radius': `var(--mantine-radius-xs)` },
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
    conditions: ['*'],
  }],
})
