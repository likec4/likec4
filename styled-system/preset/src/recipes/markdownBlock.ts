import { defineRecipe } from '@pandacss/dev'

export const markdownBlock = defineRecipe({
  className: 'likec4-markdown-block',
  jsx: ['MarkdownBlock'],
  description: 'Block with Markdown content',
  base: {
    '--text-fz': '1rem',
    '--text-fz-sm': 'calc(var(--text-fz) * var(--mantine-scale, 1) / 1.125)',
    '--text-fz-md': 'calc(var(--text-fz) * var(--mantine-scale, 1))',
    '--typography-spacing': 'calc(0.75 * var(--text-fz-md))',
    '--text-fw-headings': '600',
    '--code-background': {
      _light: 'var(--mantine-color-gray-2)',
      _dark: 'var(--mantine-color-dark-8)',
    },
    '--code-color': {
      _light: 'var(--mantine-color-black)',
      _dark: 'var(--mantine-color-white)',
    },

    fontSize: 'var(--text-fz-md)',
    lineHeight: 'var(--mantine-line-height)',

    '& :first-child': {
      marginTop: '0',
    },

    '& :last-child': {
      marginBottom: '0',
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
      fontSize: 'calc(1.476 * var(--text-fz-md))',
      fontWeight: 'var(--text-fw-headings)',
    },
    '& :is(h2)': {
      fontSize: 'calc(1.383 * var(--text-fz-md))',
      // lineHeight: 'var(--mantine-h2-line-height)',
      fontWeight: 'var(--text-fw-headings)',
    },
    '& :is(h3)': {
      fontSize: 'calc(1.296 * var(--text-fz-md))',
      // lineHeight: 'var(--mantine-h3-line-height)',
      fontWeight: 'var(--text-fw-headings)',
    },
    '& :is(h4)': {
      fontSize: 'calc(1.215 * var(--text-fz-md))',
      // lineHeight: 'var(--mantine-h4-line-height)',
      fontWeight: 'var(--text-fw-headings)',
    },
    '& :is(h5)': {
      fontSize: 'calc(1.138 * var(--text-fz-md))',
      // lineHeight: 'var(--mantine-h4-line-height)',
      fontWeight: 'var(--text-fw-headings)',
    },
    '& :is(h6)': {
      fontSize: 'calc(1.067 * var(--text-fz-md))',
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
      marginTop: 'calc(var(--typography-spacing) / 2)',
      marginBottom: 'calc(var(--typography-spacing) / 2)',
      border: 'none',
      borderBottom: '1px solid',
      borderColor: {
        _light: 'mantine.colors.gray[3]',
        _dark: 'mantine.colors.dark[3]',
      },
    },
    '& :where(pre)': {
      px: '3',
      py: '2',
      lineHeight: 'var(--mantine-line-height-xs)',
      margin: '0',
      marginTop: 'var(--typography-spacing)',
      marginBottom: 'var(--typography-spacing)',
      overflowX: 'auto',
      fontFamily: 'var(--mantine-font-family-monospace)',
      fontSize: 'var(--text-fz-sm)',
      borderRadius: 'sm',

      backgroundColor: 'var(--code-background)',
      color: 'var(--code-color)',
    },

    '& :where(code)': {
      lineHeight: '1',
      padding: '1px 4px',
      borderRadius: 'xs',
      fontFamily: 'var(--mantine-font-family-monospace)',
      fontSize: 'var(--text-fz-sm)',

      backgroundColor: 'var(--code-background)',
      color: 'var(--code-color)',
    },
    '& :where(pre code)': {
      backgroundColor: 'transparent',
      padding: '0',
      borderRadius: '0',
      color: 'inherit',
      border: '0',
    },

    '& :where(ul, ol):not([data-type="taskList"])': {
      marginBottom: 'var(--typography-spacing)',
      paddingInlineStart: 'var(--typography-spacing)',
      listStylePosition: 'inside',
    },

    '& :where(table)': {
      width: '100%',
      borderCollapse: 'collapse',
      captionSide: 'bottom',
      marginBottom: 'var(--typography-spacing)',

      _light: {
        ['--table-border-color']: 'var(--mantine-color-gray-3)',
      },

      _dark: {
        ['--table-border-color']: 'var(--mantine-color-dark-4)',
      },

      '& :where(caption)': {
        marginTop: 'calc(.5 * var(--typography-spacing) + 1px)',
        fontSize: 'var(--text-fz-sm)',
        color: 'var(--mantine-color-dimmed)',
      },

      '& :where(th)': {
        textAlign: 'left',
        fontWeight: 'bold',
        fontSize: 'var(--text-fz-sm)',
        padding: 'var(--typography-spacing)',
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
        padding: 'var(--typography-spacing)',
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
      margin: '0',
      borderRadius: 'var(--mantine-radius-sm)',
      padding: 'xs',
      backgroundColor: {
        _light: 'var(--mantine-color-gray-1)',
        _dark: 'var(--mantine-color-dark-5)',
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
        '--code-background': 'color-mix(in srgb , var(--likec4-palette-stroke) 70%, transparent)',
        '--code-color': 'var(--likec4-palette-loContrast)',
        '--typography-spacing': 'calc(0.5 * var(--text-fz-md))',
        '& :where(a)': {
          color: 'var(--likec4-palette-fill)/45',
          mixBlendMode: 'difference',
        },
        '& :where(strong)': {
          color: `color-mix(in srgb , var(--likec4-palette-hiContrast) 50%,  var(--likec4-palette-loContrast))`,
        },
        '& :where(blockquote)': {
          padding: 'xxs',
          backgroundColor: 'var(--likec4-palette-stroke)/65',
        },
        '& :where(hr)': {
          borderColor: 'var(--likec4-palette-stroke)/85',
        },
      },
      false: {},
    },
    /**
     * Markdown block can receive either markdown or plain text.
     */
    value: {
      // default
      markdown: {},
      // when block receives a plain text
      plaintext: {
        '& :where(p)': {
          whiteSpace: 'preserve-breaks',
        },
      },
    },
  },

  defaultVariants: {
    uselikec4palette: false,
    value: 'markdown',
  },

  staticCss: [{
    uselikec4palette: ['*'],
    value: ['plaintext'],
    conditions: ['*'],
  }],
})
