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

export const likec4tag = defineRecipe({
  className: 'likec4-tag',
  base: {
    pointerEvents: 'all',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    width: 'min-content',
    transition: 'fast',
    fontSize: 'xs',
    fontFamily: 'var(--likec4-element-font, {fonts.likec4})',
    fontWeight: 500,
    '& > span': {
      display: 'inline-block',
      // lineHeight: 1.5,
    },
    whiteSpace: 'nowrap',
    px: 5,
    border: 'none',
    borderRadius: 3,
    color: 'likec4.tag.text',
    backgroundColor: {
      base: 'likec4.tag.bg',
      _hover: 'likec4.tag.bg.hover',
    },
  },
  variants: {
    autoTextColor: {
      false: {},
      true: {
        color: 'likec4.tag.bg',
        '& > span': {
          filter: 'invert(1) grayscale(1) brightness(1.3) contrast(9000)',
          mixBlendMode: 'luminosity',
        },
      },
    },
  },
  defaultVariants: {
    autoTextColor: false,
  },
  staticCss: [{
    autoTextColor: ['true'],
    conditions: ['hover'],
  }],
})
