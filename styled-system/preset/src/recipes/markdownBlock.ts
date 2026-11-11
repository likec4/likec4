import { defineRecipe } from '@pandacss/dev'
import { __v } from '../const.ts'
import { mantine } from '../generated.ts'
import { alpha } from '../helpers.ts'

/**
 * SVG icon (24x24, tabler) as a data URL, to be used as a mask (color comes from `background-color`)
 */
function iconUrl(paths: string, filled = false): string {
  const attrs = filled
    ? `fill='black'`
    : `fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'`
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' ${attrs}>${paths}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/**
 * Icons of Markdown refs, same as in the UI: cube for elements, view type icons for views
 */
const refIcons = {
  element: iconUrl(
    `<path d='M21 16.008v-8.018a1.98 1.98 0 0 0 -1 -1.717l-7 -4.008a2.016 2.016 0 0 0 -2 0l-7 4.008c-.619 .355 -1 1.01 -1 1.718v8.018c0 .709 .381 1.363 1 1.717l7 4.008a2.016 2.016 0 0 0 2 0l7 -4.008c.619 -.355 1 -1.01 1 -1.718'/><path d='M12 22v-10'/><path d='M12 12l8.73 -5.04'/><path d='M3.27 6.96l8.73 5.04'/>`,
  ),
  elementView: iconUrl(
    `<path d='M8 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0'/><path d='M16 16l-2.5 -2.5'/><path d='M3 7v-2a2 2 0 0 1 2 -2h2'/><path d='M3 17v2a2 2 0 0 0 2 2h2'/><path d='M17 3h2a2 2 0 0 1 2 2v2'/><path d='M17 21h2a2 2 0 0 0 2 -2v-2'/>`,
  ),
  dynamicView: iconUrl(
    `<path d='M10.52 2.614a2.095 2.095 0 0 1 2.835 -.117l.126 .117l7.905 7.905c.777 .777 .816 2.013 .117 2.836l-.117 .126l-7.905 7.905a2.094 2.094 0 0 1 -2.836 .117l-.126 -.117l-7.907 -7.906a2.096 2.096 0 0 1 -.115 -2.835l.117 -.126l7.905 -7.905zm5.969 9.535l.01 -.116l-.003 -.12l-.016 -.114l-.03 -.11l-.044 -.112l-.052 -.098l-.076 -.105l-.07 -.081l-3.5 -3.5l-.095 -.083a1 1 0 0 0 -1.226 0l-.094 .083l-.083 .094a1 1 0 0 0 0 1.226l.083 .094l1.792 1.793h-5.085l-.117 .007a1 1 0 0 0 0 1.986l.117 .007h5.085l-1.792 1.793l-.083 .094a1 1 0 0 0 1.403 1.403l.094 -.083l3.5 -3.5l.097 -.112l.05 -.074l.037 -.067l.05 -.112l.023 -.076l.025 -.117z'/>`,
    true,
  ),
  deploymentView: iconUrl(
    `<path d='M12 4l-8 4l8 4l8 -4l-8 -4'/><path d='M4 12l8 4l8 -4'/><path d='M4 16l8 4l8 -4'/>`,
  ),
}

export const markdownBlock = defineRecipe({
  className: 'likec4-markdown-block',
  jsx: [
    'MarkdownBlock',
    'Markdown',
  ],
  description: 'Block with Markdown content',
  base: {
    '--md-scale': 'var(--mantine-scale, 1)',
    '--text-fz': '1em',
    '--text-fz-sm': 'calc(var(--text-fz) * var(--md-scale) / 1.125)',
    '--text-fz-md': 'calc(var(--text-fz) * var(--md-scale))',
    '--typography-spacing': 'calc(0.75 * var(--text-fz-md))',
    '--text-fw-headings': '600',
    '--code-background': '{colors.surface.code}',
    '--code-color': '{colors.text.bright}',

    _dark: {
      '--color-border-default': '#30363d',
      '--color-accent-fg': '#58a6ff',
      '--color-accent-emphasis': '#1f6feb',
      '--color-danger-fg': '#f85149',
      '--color-danger-emphasis': '#da3633',
      '--color-attention-fg': '#d29922',
      '--color-attention-emphasis': '#9e6a03',
      '--color-done-fg': '#a371f7',
      '--color-done-emphasis': '#8957e5',
      '--color-success-fg': '#3fb950',
      '--color-success-emphasis': '#238636',
    },
    _light: {
      '--color-border-default': '#d0d7de',
      '--color-accent-fg': '#0969da',
      '--color-accent-emphasis': '#0969da',
      '--color-danger-fg': '#d1242f',
      '--color-danger-emphasis': '#cf222e',
      '--color-attention-fg': '#9a6700',
      '--color-attention-emphasis': '#9a6700',
      '--color-done-fg': '#8250df',
      '--color-done-emphasis': '#8250df',
      '--color-success-fg': '#1a7f37',
      '--color-success-emphasis': '#1f883d',
    },

    fontSize: 'var(--text-fz-md)',
    lineHeight: mantine.lineHeight,

    '& :first-child': {
      marginTop: '0',
    },

    '& :last-child': {
      marginBottom: '0',
    },
    '& :where(h1, h2, h3, h4, h5, h6)': {
      lineHeight: '1.5',
      textWrap: 'var(--mantine-heading-text-wrap)',
      fontFamily: '{fonts.display}',
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
      fontWeight: '550',
    },

    '& :where(mark)': {
      fontSize: 'var(--text-fz-md)',
      backgroundColor: mantine.colors.yellow[2],
      color: 'inherit',
      _dark: {
        backgroundColor: mantine.colors.yellow[5],
        color: mantine.colors.black,
      },
    },

    '& :where(a)': {
      fontSize: 'var(--text-fz-md)',
      color: mantine.colors.anchor,
      textDecoration: 'none',
      fontWeight: '450',
      _hover: {
        textDecoration: 'underline',
      },
    },

    '& :where(hr)': {
      marginTop: 'calc(var(--typography-spacing) / 2)',
      marginBottom: 'calc(var(--typography-spacing) / 2)',
      border: 'none',
      borderBottom: '1px solid',
      borderColor: 'border.strong',
    },
    '& :where(pre)': {
      px: '3',
      py: '2',
      lineHeight: mantine.lineHeights.xs,
      margin: '0',
      marginTop: 'var(--typography-spacing)',
      marginBottom: 'var(--typography-spacing)',
      overflowX: 'auto',
      fontFamily: '{fonts.mono}',
      fontSize: 'var(--text-fz-sm)',
      borderRadius: 'sm',

      backgroundColor: 'var(--code-background)',
      color: 'var(--code-color)',
    },

    '& :where(code)': {
      lineHeight: '1',
      padding: '1px 4px',
      borderRadius: 'xs',
      fontFamily: '{fonts.mono}',
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
    '& :where(pre .code-line)': {
      display: 'block',
      minWidth: 'max-content',
      marginInline: '-0.75rem',
      paddingInline: '0.75rem',
    },
    '& :where(pre .code-line.inserted)': {
      backgroundColor: {
        base: 'rgba(26, 127, 55, 0.14)',
        _dark: 'rgba(46, 160, 67, 0.18)',
      },
      boxShadow: 'inset 3px 0 #2da44e',
    },
    '& :where(pre .code-line.deleted)': {
      backgroundColor: {
        base: 'rgba(207, 34, 46, 0.12)',
        _dark: 'rgba(248, 81, 73, 0.18)',
      },
      boxShadow: 'inset 3px 0 #cf222e',
    },
    '& :where(pre .token.comment, pre .token.prolog, pre .token.doctype, pre .token.cdata)': {
      color: {
        base: '#6e7781',
        _dark: '#8b949e',
      },
    },
    '& :where(pre .token.punctuation)': {
      color: {
        base: '#57606a',
        _dark: '#c9d1d9',
      },
    },
    '& :where(pre .token.property, pre .token.tag, pre .token.constant, pre .token.symbol, pre .token.deleted)': {
      color: {
        base: '#cf222e',
        _dark: '#ff7b72',
      },
    },
    '& :where(pre .token.boolean, pre .token.number)': {
      color: {
        base: '#0550ae',
        _dark: '#79c0ff',
      },
    },
    '& :where(pre .token.selector, pre .token.attr-name, pre .token.string, pre .token.char, pre .token.builtin, pre .token.inserted)':
      {
        color: {
          base: '#116329',
          _dark: '#a5d6ff',
        },
      },
    '& :where(pre .token.operator, pre .token.entity, pre .token.url)': {
      color: {
        base: '#953800',
        _dark: '#ffa657',
      },
    },
    '& :where(pre .token.atrule, pre .token.attr-value, pre .token.function, pre .token.class-name)': {
      color: {
        base: '#8250df',
        _dark: '#d2a8ff',
      },
    },
    '& :where(pre .token.keyword)': {
      color: {
        base: '#cf222e',
        _dark: '#ff7b72',
      },
    },
    '& :where(pre .token.regex, pre .token.important, pre .token.variable)': {
      color: {
        base: '#0a3069',
        _dark: '#a5d6ff',
      },
    },
    '& :where(pre .token.important, pre .token.bold)': {
      fontWeight: 'bold',
    },
    '& :where(pre .token.italic)': {
      fontStyle: 'italic',
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
        ['--table-border-color']: '{colors.gray[3]}',
      },

      _dark: {
        ['--table-border-color']: '{colors.dark[4]}',
      },

      '& :where(caption)': {
        marginTop: 'calc(.5 * var(--typography-spacing) + 1px)',
        fontSize: 'var(--text-fz-sm)',
        color: 'var(--mantine-color-dimmed)',
      },

      '& :where(th)': {
        textAlign: 'left',
        fontWeight: '550',
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
      backgroundColor: '{colors.surface.sunken}',
      '&:not(:first-child)': {
        marginTop: 'var(--typography-spacing)',
      },
    },
    '& .markdown-alert': {
      borderLeft: '.25em solid var(--borderColor-default, var(--color-border-default))',
      color: 'inherit',
      marginBottom: 'calc(var(--typography-spacing) * 1.5)',

      paddingLeft: '1em',
      paddingRight: '.5em',

      '&:last-child': {
        marginBottom: '0!important',
      },
      '& .markdown-alert-title': {
        alignItems: 'center',
        display: 'flex',
        fontSize: 'var(--text-fz-md)',
        fontWeight: '550',
        lineHeight: '1.5',
        marginBottom: '0.1em',
        gap: '2',
      },

      '& .markdown-alert-title svg': {
        height: 'var(--text-fz-md)',
        fill: 'currentColor',
      },
      '&.markdown-alert-note': {
        borderLeftColor: 'var(--borderColor-accent-emphasis,var(--color-accent-emphasis))',
      },
      '&.markdown-alert-note .markdown-alert-title': {
        color: [
          'var(--color-accent-fg)',
          'var(--fgColor-accent,var(--color-accent-fg))',
        ],
      },
      '&.markdown-alert-tip': {
        borderLeftColor: 'var(--borderColor-success-emphasis,var(--color-success-emphasis))',
      },
      '&.markdown-alert-tip .markdown-alert-title': {
        color: [
          'var(--color-success-fg)',
          'var(--fgColor-success,var(--color-success-fg))',
        ],
      },
      '&.markdown-alert-important': {
        borderLeftColor: 'var(--borderColor-done-emphasis,var(--color-done-emphasis))',
      },
      '&.markdown-alert-important .markdown-alert-title': {
        color: [
          'var(--color-done-fg)',
          'var(--fgColor-done,var(--color-done-fg))',
        ],
      },
      '&.markdown-alert-warning': {
        borderLeftColor: 'var(--borderColor-attention-emphasis,var(--color-attention-emphasis))',
      },
      '&.markdown-alert-warning .markdown-alert-title': {
        color: [
          'var(--color-attention-fg)',
          'var(--fgColor-attention,var(--color-attention-fg))',
        ],
      },
      '&.markdown-alert-caution': {
        borderLeftColor: 'var(--borderColor-danger-emphasis,var(--color-danger-emphasis))',
      },
      '&.markdown-alert-caution .markdown-alert-title': {
        color: [
          'var(--color-danger-fg)',
          'var(--fgColor-danger,var(--color-danger-fg))',
        ],
      },
    },

    // Refs resolved by the diagram (see resolveMarkdownRefs), generic Markdown has no icons
    '& [data-likec4-ref-state="link"]': {
      '--likec4-ref-icon': refIcons.element,
      display: 'inline-block',
      borderRadius: 'sm',
      paddingInline: '1',
      border: '1px solid',
      borderColor: 'currentColor/15',
      textDecoration: 'none',
      _before: {
        content: '""',
        display: 'inline-block',
        width: '0.9em',
        height: '0.9em',
        marginInlineEnd: '0.25em',
        verticalAlign: '-0.1em',
        backgroundColor: 'currentColor',
        maskImage: 'var(--likec4-ref-icon)',
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      },
      _hover: {
        textDecoration: 'none',
        borderColor: 'currentColor/25',
        backgroundColor: 'currentColor/10',
      },
    },
    '& [data-likec4-ref-state="link"][data-likec4-ref-kind="view"]': {
      '--likec4-ref-icon': refIcons.elementView,
      color: 'var(--color-done-fg)',
    },
    '& [data-likec4-ref-state="link"][data-likec4-ref-view-type="dynamic"]': {
      '--likec4-ref-icon': refIcons.dynamicView,
    },
    '& [data-likec4-ref-state="link"][data-likec4-ref-view-type="deployment"]': {
      '--likec4-ref-icon': refIcons.deploymentView,
    },
  },

  variants: {
    /**
     * When markdown block is used inside a diagram node, this variant should be used to apply the likec4 palette.
     */
    uselikec4palette: {
      true: {
        '--code-background': 'color-mix(in oklab , var(--likec4-palette-stroke) 70%, transparent)',
        '--code-color': 'var(--likec4-palette-loContrast)',
        '--typography-spacing': 'calc(0.5 * var(--text-fz-md))',
        '& :where(a)': {
          color: 'var(--likec4-palette-fill)/45',
          mixBlendMode: {
            base: 'difference',
            _print: 'normal!',
          },
        },
        '& :where(strong)': {
          color: `color-mix(in oklab, ${__v('palette.hiContrast')} 50%,  ${__v('palette.loContrast')})`,
        },
        '& :where(blockquote)': {
          padding: 'xxs',
          backgroundColor: alpha(__v('palette.stroke'), 65),
        },
        '& :where(hr)': {
          borderColor: alpha(__v('palette.stroke'), 85),
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

  staticCss: ['*'],
})
