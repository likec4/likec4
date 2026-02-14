"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.markdownBlock = void 0;
var dev_1 = require("@pandacss/dev");
var const_ts_1 = require("../const.ts");
var generated_ts_1 = require("../generated.ts");
var helpers_ts_1 = require("../helpers.ts");
exports.markdownBlock = (0, dev_1.defineRecipe)({
    className: 'likec4-markdown-block',
    jsx: [
        'MarkdownBlock',
        'Markdown',
    ],
    description: 'Block with Markdown content',
    base: {
        '--text-fz': '1em',
        '--text-fz-sm': 'calc(var(--text-fz) * var(--mantine-scale, 1) / 1.125)',
        '--text-fz-md': 'calc(var(--text-fz) * var(--mantine-scale, 1))',
        '--typography-spacing': 'calc(0.75 * var(--text-fz-md))',
        '--text-fw-headings': '600',
        '--code-background': {
            base: generated_ts_1.mantine.colors.gray[2],
            _dark: generated_ts_1.mantine.colors.dark[8],
        },
        '--code-color': {
            base: generated_ts_1.mantine.colors.black,
            _dark: generated_ts_1.mantine.colors.white,
        },
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
        lineHeight: generated_ts_1.mantine.lineHeight,
        '& :first-child': {
            marginTop: '0',
        },
        '& :last-child': {
            marginBottom: '0',
        },
        '& :where(h1, h2, h3, h4, h5, h6)': {
            lineHeight: '1.5',
            textWrap: 'var(--mantine-heading-text-wrap)',
            fontFamily: generated_ts_1.mantine.fontFamilyHeadings,
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
            backgroundColor: generated_ts_1.mantine.colors.yellow[2],
            color: 'inherit',
            _dark: {
                backgroundColor: generated_ts_1.mantine.colors.yellow[5],
                color: generated_ts_1.mantine.colors.black,
            },
        },
        '& :where(a)': {
            fontSize: 'var(--text-fz-md)',
            color: generated_ts_1.mantine.colors.anchor,
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
            borderColor: {
                base: generated_ts_1.mantine.colors.gray[3],
                _dark: generated_ts_1.mantine.colors.dark[3],
            },
        },
        '& :where(pre)': {
            px: '3',
            py: '2',
            lineHeight: generated_ts_1.mantine.lineHeights.xs,
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
            _light: (_a = {},
                _a['--table-border-color'] = generated_ts_1.mantine.colors.gray['3'],
                _a),
            _dark: (_b = {},
                _b['--table-border-color'] = 'var(--mantine-color-dark-4)',
                _b),
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
            backgroundColor: {
                base: generated_ts_1.mantine.colors.gray[1],
                _dark: generated_ts_1.mantine.colors.dark[5],
            },
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
                    color: "color-mix(in oklab, ".concat((0, const_ts_1.__v)('palette.hiContrast'), " 50%,  ").concat((0, const_ts_1.__v)('palette.loContrast'), ")"),
                },
                '& :where(blockquote)': {
                    padding: 'xxs',
                    backgroundColor: (0, helpers_ts_1.alpha)((0, const_ts_1.__v)('palette.stroke'), 65),
                },
                '& :where(hr)': {
                    borderColor: (0, helpers_ts_1.alpha)((0, const_ts_1.__v)('palette.stroke'), 85),
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
});
