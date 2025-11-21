import { defineRecipe } from '@pandacss/dev'

export const actionBtn = defineRecipe({
  className: 'action-btn',
  description: 'Action Button within Diagram Node (Bottom-Center)',
  base: {
    pointerEvents: 'all',
    cursor: 'pointer',
    color: 'var(--actionbtn-color)',
    opacity: 0.75,

    '--actionbtn-color': 'var(--likec4-palette-loContrast)',
    '--actionbtn-color-hovered': 'var(--likec4-palette-loContrast)',
    '--actionbtn-color-hovered-btn': 'var(--likec4-palette-hiContrast)',

    '--actionbtn-bg-idle': `color-mix(in oklab , var(--likec4-palette-fill),  transparent 99%)`,
    '--actionbtn-bg-hovered': `color-mix(in oklab , var(--likec4-palette-fill) 65%, var(--likec4-palette-stroke))`,
    '--actionbtn-bg-hovered-btn': `color-mix(in oklab , var(--likec4-palette-fill) 50%, var(--likec4-palette-stroke))`,

    '--ai-bg': `var(--actionbtn-bg-idle)`,

    background: `var(--ai-bg)`,

    _whenHovered: {
      opacity: 1,
      color: 'var(--actionbtn-color-hovered)',
      '--ai-bg': `var(--actionbtn-bg-hovered)`,
    },
    _hover: {
      opacity: 1,
      color: 'var(--actionbtn-color-hovered-btn)',
      '--ai-bg': `var(--actionbtn-bg-hovered-btn)`,
    },
    _reduceGraphicsOnPan: {
      display: 'none',
    },
    _smallZoom: {
      display: 'none',
    },
    '& *': {
      pointerEvents: 'none',
    },
    _print: {
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
    size: ['*'],
    radius: ['*'],
    variant: ['*'],
    conditions: ['*'],
  }],
})
