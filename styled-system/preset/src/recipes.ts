import { defineRecipe } from '@pandacss/dev'

export const actionBtn = defineRecipe({
  className: 'action-btn',
  description: 'The styles for the Action Buttons',
  base: {
    pointerEvents: 'all',
    cursor: 'pointer',
    color: '{colors.likec4.element.loContrast}',
    opacity: 0.75,
    '--_idle': `color-mix(in srgb , {colors.likec4.element.fill},  transparent 99%)`,
    '--_node-hovered': `color-mix(in srgb , {colors.likec4.element.fill} 65%, {colors.likec4.element.stroke})`,
    '--_btn-hovered': `color-mix(in srgb , {colors.likec4.element.fill} 50%, {colors.likec4.element.stroke})`,

    '--ai-bg': `var(--_idle)`,
    background: `var(--ai-bg)`,
    boxShadow: '1px 1px 3px 0px transparent',
    _whenHovered: {
      opacity: 1,
      '--ai-bg': `var(--_node-hovered)`,
    },
    _hover: {
      color: '{colors.likec4.element.hiContrast}',
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
    conditions: [
      'whenHovered',
      'compoundTransparent',
    ],
  }],
})
