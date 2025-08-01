import { defineRecipe } from '@pandacss/dev'

export const actionBtn = defineRecipe({
  className: 'action-btn',
  description: 'Action Button within Diagram Node (Bottom-Center)',
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

export const markdownBlock = defineRecipe({
  className: 'likec4-markdown-block',
  jsx: ['MarkdownBlock'],
  description: 'Block with Markdown content',
  base: {
    pointerEvents: 'all',
    '--text-fz': '1rem',
    '--typography-spacing': 'calc(0.75 * var(--text-fz) * var(--mantine-scale, 1))',
    '--text-fz-sm': 'calc(var(--text-fz) * var(--mantine-scale) / 1.125)',
    '--text-fz-md': 'calc(var(--text-fz) * var(--mantine-scale))',
    '--text-fw-headings': '600',

    paddingBottom: 'calc(.5 * var(--typography-spacing) + 1px)',
    fontSize: 'var(--text-fz-md)',

    '& :first-child': {
      marginTop: 0,
    },

    '& :last-child': {
      marginBottom: 0,
    },
    '& :where(h1, h2, h3, h4, h5, h6)': {
      lineHeight: '1.5',
      textWrap: 'var(--mantine-heading-text-wrap)',
      fontFamily: 'var(--mantine-font-family-headings)',
      marginBottom: 'var(--typography-spacing)',
    },
    '& :is(h1, h2, h3, h4, h5, h6):not(:first-child)': {
      marginTop: 'var(--typography-spacing)',
    },

    '& :is(h1)': {
      fontSize: 'calc(1.476 * var(--text-fz) * var(--mantine-scale, 1))',
      fontWeight: 'var(--text-fw-headings)',
    },
    '& :is(h2)': {
      fontSize: 'calc(1.383 * var(--text-fz) * var(--mantine-scale, 1))',
      // lineHeight: 'var(--mantine-h2-line-height)',
      fontWeight: 'var(--text-fw-headings)',
    },
    '& :is(h3)': {
      fontSize: 'calc(1.296 * var(--text-fz) * var(--mantine-scale, 1))',
      // lineHeight: 'var(--mantine-h3-line-height)',
      fontWeight: 'var(--text-fw-headings)',
    },
    '& :is(h4)': {
      fontSize: 'calc(1.215 * var(--text-fz) * var(--mantine-scale, 1))',
      // lineHeight: 'var(--mantine-h4-line-height)',
      fontWeight: 'var(--text-fw-headings)',
    },
    '& :is(h5)': {
      fontSize: 'calc(1.138 * var(--text-fz) * var(--mantine-scale, 1))',
      // lineHeight: 'var(--mantine-h4-line-height)',
      fontWeight: 'var(--text-fw-headings)',
    },
    '& :is(h6)': {
      fontSize: 'calc(1.067 * var(--text-fz) * var(--mantine-scale, 1))',
      // lineHeight: 'var(--mantine-h4-line-height)',
      fontWeight: 'var(--text-fw-headings)',
    },

    '& :where(img)': {
      maxWidth: '100%',
      marginBottom: 'var(--typography-spacing)',
    },

    '& :where(p)': {
      fontSize: 'var(--text-fz-md)',
      marginTop: '0',
      marginBottom: 'var(--typography-spacing)',
      whiteSpace: 'preserve-breaks',
    },

    '& :where(strong)': {
      fontWeight: '500',
    },

    '& :where(mark)': {
      fontSize: 'var(--text-fz-md)',
      _light: {
        backgroundColor: 'mantine.colors.yellow[2]',
        color: 'inherit',
      },
      _dark: {
        backgroundColor: 'mantine.colors.yellow[5]',
        color: 'mantine.colors.black',
      },
    },

    '& :where(a)': {
      fontSize: 'var(--text-fz-md)',
      color: 'var(--mantine-color-anchor)',
      textDecoration: 'none',
      fontWeight: '500',
      _hover: {
        textDecoration: 'underline',
      },
    },

    '& :where(hr)': {
      margin: 'var(--typography-spacing)',
      border: 'none',
      borderBottom: '1px solid',
      _light: {
        borderColor: 'mantine.colors.gray[3]',
      },
      _dark: {
        borderColor: 'mantine.colors.dark[3]',
      },
    },
    '& :where(pre)': {
      padding: 'var(--mantine-spacing-xs)',
      lineHeight: 'var(--mantine-line-height)',
      margin: '0',
      marginTop: 'var(--mantine-spacing-md)',
      marginBottom: 'var(--mantine-spacing-md)',
      overflowX: 'auto',
      fontFamily: 'var(--mantine-font-family-monospace)',
      fontSize: 'var(--text-fz-sm)',
      borderRadius: 'var(--mantine-radius-xs)',
      _light: {
        backgroundColor: 'mantine.colors.gray[0]',
      },
      _dark: {
        backgroundColor: 'mantine.colors.dark[8]',
      },

      '& :where(code)': {
        backgroundColor: 'transparent',
        padding: '0',
        borderRadius: '0',
        color: 'inherit',
        border: '0',
      },
    },

    '& :where(code)': {
      lineHeight: '1',
      padding: '1px 4px',
      borderRadius: '2px',
      fontFamily: 'var(--mantine-font-family-monospace)',
      fontSize: 'var(--text-fz-sm)',

      _light: {
        backgroundColor: 'mantine.colors.gray[0]',
        color: 'mantine.colors.black',
      },

      _dark: {
        backgroundColor: 'mantine.colors.dark[5]',
        color: 'mantine.colors.white',
      },
    },

    '& :where(ul, ol):not([data-type="taskList"])': {
      marginBottom: 'var(--typography-spacing)',
      paddingInlineStart: 'var(--typography-spacing)',
      listStylePosition: 'outside',
    },

    '& :where(table)': {
      width: '100%',
      borderCollapse: 'collapse',
      captionSide: 'bottom',
      marginBottom: 'var(--mantine-spacing-md)',

      _light: {
        ['--table-border-color']: 'var(--mantine-color-gray-3)',
      },

      _dark: {
        ['--table-border-color']: 'var(--mantine-color-dark-4)',
      },

      '& :where(caption)': {
        marginTop: 'var(--mantine-spacing-xs)',
        fontSize: 'var(--text-fz-sm)',
        color: 'var(--mantine-color-dimmed)',
      },

      '& :where(th)': {
        textAlign: 'left',
        fontWeight: 'bold',
        fontSize: 'var(--text-fz-sm)',
        padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-xs)',
      },

      '& :where(thead th)': {
        borderBottom: '1px solid',
        borderColor: 'var(--table-border-color)',
      },

      '& :where(tfoot th)': {
        borderTop: '1px solid',
        borderColor: 'var(--table-border-color)',
      },

      '& :where(td)': {
        padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-xs)',
        borderBottom: '1px solid',
        borderColor: 'var(--table-border-color)',
        fontSize: 'var(--text-fz-sm)',
      },

      '& :where(tr:last-of-type td)': {
        borderBottom: '0',
      },
    },

    '& :where(blockquote)': {
      fontSize: 'var(--text-fz-md)',
      lineHeight: 'var(--mantine-line-height)',
      margin: '0',
      borderRadius: 'var(--mantine-radius-sm)',
      padding: 'xs',

      _light: {
        backgroundColor: 'mantine.colors.gray[1]',
      },

      _dark: {
        backgroundColor: 'mantine.colors.dark[5]',
      },
      '&:not(:first-child)': {
        marginTop: 'var(--typography-spacing)',
      },
    },
  },

  variants: {
    /**
     * When markdown block is used inside a diagram node, this variant should be used to apply the likec4 palette.
     */
    uselikec4palette: {
      true: {
        '--typography-spacing': 'calc(0.25rem * var(--mantine-scale, 1))',
        '& :where(a)': {
          color: 'likec4.palette.fill/45',
          mixBlendMode: 'difference',
        },
        '& :where(code)': {
          borderColor: 'likec4.palette.stroke/85',
          color: 'likec4.palette.hiContrast',
          backgroundColor: 'likec4.palette.stroke/70',
        },
        '& :where(strong)': {
          color: `color-mix(in srgb , {colors.likec4.palette.hiContrast} 50%,  {colors.likec4.palette.loContrast})`,
        },
        '& :where(blockquote)': {
          padding: '2xs',
          backgroundColor: 'likec4.palette.stroke/65',
        },
      },
      false: {},
    },
  },

  defaultVariants: {
    uselikec4palette: false,
  },

  staticCss: [{
    uselikec4palette: ['true'],
    conditions: ['hover'],
  }],
})

export const navigationPanelActionIcon = defineRecipe({
  className: 'likec4-navigation-panel-icon',
  jsx: ['PanelActionIcon'],
  description: 'ActionIcon for navigation panel',
  base: {
    color: {
      base: 'likec4.panel.action-icon.text',
      _hover: 'likec4.panel.action-icon.text.hover',
      // _hover: {
      //   base: 'likec4.panel.action-icon.text.hover',
      //   // _disabled: 'likec4.panel.action-icon.text.dimmed',
      // },
      _disabled: 'likec4.panel.action-icon.text.disabled',
    },
    _disabled: {
      opacity: 0.5,
    },
  },
  variants: {
    variant: {
      'default': {
        backgroundColor: {
          base: '[transparent]',
          _hover: 'likec4.panel.action-icon.bg.hover',
          _disabled: '[transparent]',
        },
      },
      'filled': {
        backgroundColor: {
          base: 'likec4.panel.action-icon.bg',
          _hover: 'likec4.panel.action-icon.bg.hover',
          _disabled: 'likec4.panel.action-icon.bg',
        },
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
  staticCss: [{
    variant: ['*'],
  }],
})
