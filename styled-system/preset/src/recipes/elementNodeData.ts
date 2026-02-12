import { defineParts, defineRecipe } from '@pandacss/dev'
import { __v, vars } from '../const.ts'
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
      paddingTop: __v('spacing'),
      paddingBottom: __v('spacing'),
      paddingLeft: `calc(${__v('spacing')} + 8px)`,
      paddingRight: `calc(${__v('spacing')} + 8px)`,
      overflow: 'hidden',
      pointerEvents: 'none',
      gap: '3',

      [textAlign]: 'center',

      _shapeQueue: {
        paddingLeft: '46px',
        paddingRight: '16px',
      },
      _shapeMobile: {
        paddingLeft: '46px',
        paddingRight: '16px',
      },
      _shapeCylinder: {
        paddingTop: '30px',
      },
      _shapeStorage: {
        paddingTop: '30px',
      },
      _shapeBrowser: {
        paddingTop: '32px',
        paddingBottom: '28px',
      },
      _shapeBucket: {
        paddingLeft: `calc(${__v('spacing')} + 20px)`,
        paddingRight: `calc(${__v('spacing')} + 20px)`,
      },
      _shapeComponent: {
        paddingLeft: `calc(${__v('spacing')} + 30px)`,
      },

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
        gap: '4',
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
      gap: '2',
      '&:has([data-likec4-node-description]):has([data-likec4-node-technology])': {
        gap: '1.5',
      },
    },
    title: {
      flex: '0 0 auto',

      fontFamily: 'likec4.element',
      fontWeight: 'medium',
      fontSize: __v('textsize'),
      lineHeight: 'sm',
      textWrapStyle: 'balance',
      whiteSpace: 'preserve-breaks',

      textAlign: varTextAlign,
      color: __v('palette.hiContrast'),
      lineClamp: {
        base: 3,
        _shapeSizeXs: 2,
        _shapeSizeSm: 2,
      },
    },
    description: {
      flexGrow: '0',
      flexShrink: '1',

      fontFamily: 'likec4.element',
      fontWeight: '420',
      fontSize: `calc(${__v('textsize')} * 0.74)`,
      lineHeight: 'xs',
      textWrapStyle: 'pretty',
      '--text-fz': `calc(${__v('textsize')} * 0.74)`,

      color: __v('palette.loContrast'),
      textAlign: varTextAlign,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      lineClamp: {
        base: '5',
        _shapeSizeSm: '3',
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
      fontWeight: 'normal',
      fontSize: `calc(${__v('textsize')} * 0.635)`,
      lineHeight: 'xs',
      '--text-fz': `calc(${__v('textsize')} * 0.635)`,

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
            gap: '4',
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
            gap: '2',
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
            gap: '2',
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
      false: parts({
        icon: {
          mixBlendMode: {
            base: 'hard-light',
            _reduceGraphicsOnPan: 'normal',
          },
        },
      }),
    },
  },
  defaultVariants: {
    iconPosition: 'left',
    withIconColor: false,
  },
  staticCss: [{
    withIconColor: ['*'],
    iconPosition: ['*'],
    conditions: ['*'],
  }],
})
