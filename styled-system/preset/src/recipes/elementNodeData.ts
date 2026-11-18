import { defineParts, defineRecipe } from '@pandacss/dev'
import { __v, vars } from '../const.ts'
import { type ElementNodePadding, type ElementNodePaddings, ElementNodeMetrics as M } from '../defaults/element-node.ts'
import { defaultSizes } from '../defaults/sizes.ts'

const parts = defineParts({
  root: { selector: '&' },
  icon: { selector: '& [data-likec4-icon]' },
  content: { selector: '& .likec4-element-node-content' },
  title: { selector: '& [data-likec4-node-title]' },
  description: { selector: '& [data-likec4-node-description]' },
  technology: { selector: '& [data-likec4-node-technology]' },
})

const hasIcon = '&:has([data-likec4-icon])'

// Layouts measure the content with these metrics (see ElementNodeMetrics)
const cssPadding = (p: ElementNodePadding) =>
  'px' in p ? `${p.px}px` : p.extra === 0 ? __v('spacing') : `calc(${__v('spacing')} + ${p.extra}px)`

const paddings = ({ top, right, bottom, left }: ElementNodePaddings) => ({
  paddingTop: cssPadding(top),
  paddingRight: cssPadding(right),
  paddingBottom: cssPadding(bottom),
  paddingLeft: cssPadding(left),
})

const textAlign = '--__text-align'
const varTextAlign = `var(${textAlign})`

export const elementNodeData = defineRecipe({
  className: 'likec4-element-node-data',
  jsx: ['ElementNodeData', 'ElementNodeData.Root', 'ElementTitle', 'Root'],
  base: parts({
    root: {
      position: 'relative',
      flex: '1',
      height: 'fit-content',
      width: 'fit-content',
      maxHeight: '100%',
      maxWidth: '100%',
      margin: 'auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      ...paddings(M.paddings.default),
      overflow: 'hidden',
      pointerEvents: 'none',
      gap: '3',

      [textAlign]: 'center',

      _shapeQueue: paddings(M.paddings.queue),
      _shapeMobile: paddings(M.paddings.mobile),
      _shapeCylinder: paddings(M.paddings.cylinder),
      _shapeStorage: paddings(M.paddings.storage),
      _shapeBrowser: paddings(M.paddings.browser),
      _shapeBucket: paddings(M.paddings.bucket),
      _shapeComponent: paddings(M.paddings.component),

      _shapeSizeXs: {
        [vars.icon.size]: `${defaultSizes.iconSizes.xs}px`,
      },
      _shapeSizeSm: {
        [vars.icon.size]: `${defaultSizes.iconSizes.sm}px`,
      },
      _shapeSizeMd: {
        [vars.icon.size]: `${defaultSizes.iconSizes.md}px`,
      },
      _shapeSizeLg: {
        [vars.icon.size]: `${defaultSizes.iconSizes.lg}px`,
        gap: '4',
      },
      _shapeSizeXl: {
        [vars.icon.size]: `${defaultSizes.iconSizes.xl}px`,
        gap: '4',
      },
      [hasIcon]: {
        gap: `${M.iconGapHorizontal}px`,
      },
    },
    icon: {
      flex: `0 0 ${__v('icon.size', '48px')}`,
      height: __v('icon.size', '48px'),
      width: __v('icon.size', '48px'),
      display: 'flex',
      alignSelf: 'flex-start',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      color: __v('icon.color', 'palette.hiContrast'),
      '& svg, & img': {
        width: '100%',
        height: 'auto',
        maxHeight: '100%',
        transition: 'fast',
        filter: {
          base: [
            'drop-shadow(0 1px 3px rgb(0 0 0 / 20%))',
            // 'drop-shadow(0 0 3px rgb(0 0 0 / 12%))',
            // 'drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))',
          ].join('\n'),
          _whenHovered: [
            'drop-shadow(0 2px 4px rgb(0 0 0 / 30%))',
            // `drop-shadow(1px 2px 3px var(--likec4-palette-stroke))`,
            // 'drop-shadow(0 0 3px rgb(0 0 0 / 12%))',
            // 'drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))',
          ].join('\n'),
          _reduceGraphicsOnPan: 'none!',
        },
      },
      '& img': {
        objectFit: 'contain',
      },
    },
    content: {
      height: 'fit-content',
      width: 'fit-content',
      maxHeight: '100%',
      maxWidth: '100%',
      flex: '0 1 auto',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      justifyContent: 'center',
      flexWrap: 'nowrap',
      overflow: 'hidden',
      gap: `${M.contentGap}px`,
      '&:has([data-likec4-node-description]):has([data-likec4-node-technology])': {
        gap: `${M.contentGapDense}px`,
      },
    },
    title: {
      flex: '0 0 auto',

      fontFamily: 'likec4.element',
      fontWeight: String(M.title.fontWeight),
      fontSize: __v('textsize'),
      lineHeight: String(M.title.lineHeight),
      textWrapStyle: 'balance',
      whiteSpace: 'preserve-breaks',

      textAlign: varTextAlign,
      color: __v('palette.hiContrast'),
      lineClamp: {
        base: M.title.maxLines.md,
        _shapeSizeXs: M.title.maxLines.xs,
        _shapeSizeSm: M.title.maxLines.sm,
      },
    },
    description: {
      flexGrow: '0',
      flexShrink: '1',

      fontFamily: 'likec4.element',
      fontWeight: String(M.description.fontWeight),
      fontSize: `calc(${__v('textsize')} * ${M.description.fontSizeRatio})`,
      lineHeight: String(M.description.lineHeight),
      textWrapStyle: 'pretty',
      '--text-fz': `calc(${__v('textsize')} * ${M.description.fontSizeRatio})`,

      color: __v('palette.loContrast'),
      textAlign: varTextAlign,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      lineClamp: {
        base: String(M.description.maxLines.md),
        _shapeSizeSm: String(M.description.maxLines.sm),
      },
      display: {
        _shapeSizeXs: 'none!',
        _smallZoom: 'none!',
      },

      '& a': {
        pointerEvents: 'all',
      },

      '& .markdown-alert': {
        mixBlendMode: 'screen',
      },
    },
    technology: {
      flex: '0 0 auto',

      fontFamily: 'likec4.element',
      fontWeight: String(M.technology.fontWeight),
      fontSize: `calc(${__v('textsize')} * ${M.technology.fontSizeRatio})`,
      lineHeight: String(M.technology.lineHeight),
      '--text-fz': `calc(${__v('textsize')} * ${M.technology.fontSizeRatio})`,
      // single line
      lineClamp: M.technology.maxLines.md,

      color: __v('palette.loContrast'),
      textAlign: varTextAlign,
      textWrap: 'balance',
      opacity: {
        base: 0.92,
        _whenHovered: 1,
      },
      display: {
        _shapeSizeXs: 'none!',
        _shapeSizeSm: 'none!',
        _smallZoom: 'none!',
      },
    },
  }),
  variants: {
    iconPosition: {
      left: parts({
        root: {
          [hasIcon]: {
            [textAlign]: 'left',
            '& .likec4-element-node-content': {
              minWidth: `calc(50% + calc(${__v('icon.size')} / 2))`,
              alignItems: 'flex-start',
            },
          },
        },
      }),
      right: parts({
        root: {
          [hasIcon]: {
            flexDirection: 'row-reverse',
            [textAlign]: 'right',
            gap: `${M.iconGapHorizontal}px`,
            '& .likec4-element-node-content': {
              minWidth: `calc(50% - calc(${__v('icon.size')} / 2))`,
              alignItems: 'flex-end',
            },
          },
        },
      }),
      top: parts({
        root: {
          [hasIcon]: {
            flexDirection: 'column',
            gap: `${M.iconGapVertical}px`,
            height: '100%',
            '& .likec4-element-node-content': {
              minHeight: `calc(50% - ${__v('icon.size')})`,
              justifyContent: 'flex-start',
            },
          },
        },
        icon: {
          alignSelf: 'center',
        },
      }),
      bottom: parts({
        root: {
          [hasIcon]: {
            flexDirection: 'column-reverse',
            gap: `${M.iconGapVertical}px`,
            height: '100%',
            '& .likec4-element-node-content': {
              justifyContent: 'flex-end',
              minHeight: `calc(50% - ${__v('icon.size')})`,
            },
          },
        },
        icon: {
          alignSelf: 'center',
        },
      }),
    },
    withIconColor: {
      true: parts({
        icon: {
          '& svg': {
            color: __v('icon.color', 'palette.stroke'),
          },
        },
      }),
      false: parts({}),
    },
    withIconBlend: {
      true: parts({
        icon: {
          mixBlendMode: {
            base: 'hard-light',
            _reduceGraphicsOnPan: 'normal',
          },
        },
      }),
      false: parts({}),
    },
    sizing: {
      fixed: parts({
        description: {
          lineClamp: M.description.fixedMaxLines,
        },
      }),
      auto: parts({}),
    },
  },
  defaultVariants: {
    iconPosition: 'left',
    withIconColor: false,
    withIconBlend: false,
    sizing: 'auto',
  },
  staticCss: ['*'],
})
