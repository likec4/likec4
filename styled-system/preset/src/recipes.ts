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
    backgroundColor: {
      base: 'likec4.tag.bg',
      _hover: 'likec4.tag.bg.hover',
    },
  },
  variants: {
    autoTextColor: {
      false: {
        '& > span': {
          color: 'likec4.tag.text',
        },
      },
      true: {
        '& > span': {
          color: '[transparent]',
          filter: 'invert(1) grayscale(1) brightness(1.3) contrast(1000)',
          background: 'inherit',
          backgroundClip: 'text',
          mixBlendMode: 'plus-lighter',
        },
      },
    },
  },
  defaultVariants: {
    autoTextColor: false,
  },
  staticCss: [{
    autoTextColor: ['true', 'false'],
    conditions: ['hover'],
  }],
})

export const descriptionRichText = defineRecipe({
  className: 'likec4-description-rich-text',
  base: {
    pointerEvents: 'all',
    '--typography-spacing': '0.1em',
    whiteSpace: 'normal',
    paddingBottom: 2,

    '& > *': {
      whiteSpace: 'preserve-breaks',
    },

    '& :first-child': {
      marginTop: 0,
    },

    '& :last-child': {
      marginBottom: 0,
    },
    '& :where(h1, h2, h3, h4, h5, h6)': {
      lineHeight: '1.3',
      fontSize: '1em',
      marginTop: 'var(--typography-spacing)',
      marginBottom: 'var(--typography-spacing)',
    },

    '& :is(h1)': {
      fontSize: '1.4em',
    },
    '& :is(h2)': {
      fontSize: '1.3em',
    },
    '& :is(h3)': {
      fontSize: '1.2em',
    },

    '& :where(img)': {
      maxWidth: '100%',
      marginBottom: 'var(--typography-spacing)',
    },

    '& :where(p)': {
      marginTop: '0',
      marginBottom: 'var(--typography-spacing)',
    },

    '& :where(a)': {
      color: 'likec4.palette.stroke',
      mixBlendMode: 'multiply',
      textDecoration: 'underline',
      _hover: {
        textDecoration: 'none',
      },
    },

    '& :where(code)': {
      padding: '0px 3px',
      borderRadius: '[2px]',
      border: '1px solid',
      borderColor: 'likec4.palette.stroke/70',
      fontSize: '0.85em',
      paddingBottom: '1px',
      backgroundColor: 'likec4.palette.stroke/50',
    },
    '& :where(ul, ol):not([data-type="taskList"])': {
      marginBottom: 'var(--typography-spacing)',
      paddingInlineStart: 'var(--typography-spacing)',
      listStylePosition: 'outside',
    },
  },
  staticCss: [{
    conditions: ['hover'],
  }],
})
