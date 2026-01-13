import { defineParts, defineRecipe } from '@pandacss/dev'
import { __v, vars } from '../const'
import { defaultSizes } from '../defaults/sizes'

const parts = defineParts({
  root: { selector: '&' },
  icon: { selector: '& [data-likec4-icon]' },
  content: { selector: '& .likec4-element-node-content' },
  title: { selector: '& [data-likec4-node-title]' },
  description: { selector: '& [data-likec4-node-description]' },
  technology: { selector: '& [data-likec4-node-technology]' },
})

const textAlign = '__text-align'
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
      margin: '[0 auto]',
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
        paddingLeft: `calc($v("spacing") + 20px)`,
        paddingRight: `calc($v("spacing") + 20px)`,
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

      [textAlign]: 'center',
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
      mixBlendMode: {
        base: 'hard-light',
        _reduceGraphicsOnPan: 'normal',
      },
      '& svg, & img': {
        width: '100%',
        height: 'auto',
        maxHeight: '100%',
        filter: {
          base: [
            'drop-shadow(0 0 3px rgb(0 0 0 / 12%))',
            'drop-shadow(0 1px 8px rgb(0 0 0 / 8%))',
            'drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))',
          ],
          _reduceGraphicsOnPan: 'none',
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
      textStyle: 'likec4.node.primary',
      flex: '0 0 auto',
      textAlign: varTextAlign,
      color: __v('palette.hiContrast'),
    },
    description: {
      flexGrow: '0',
      flexShrink: '1',
      textStyle: 'likec4.node.secondary',
      color: __v('palette.loContrast'),
      textAlign: varTextAlign,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      _shapeSizeXs: {
        display: 'none!',
      },
      lineClamp: {
        base: '5',
        _shapeSizeSm: '3',
      },
      _smallZoom: {
        display: 'none!',
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
      textStyle: 'likec4.node.secondary',
      color: __v('palette.loContrast'),
      fontSize: `calc(${__v('textsize')} * 0.635)`,
      lineHeight: 1.125,
      textAlign: varTextAlign,
      textWrap: 'balance',
      opacity: 0.92,
      _whenHovered: {
        opacity: 1,
      },
      _shapeSizeXs: {
        display: 'none!',
      },
      _shapeSizeSm: {
        display: 'none!',
      },
      _smallZoom: {
        display: 'none!',
      },
    },
  }),
  variants: {
    iconPosition: {
      top: parts({
        root: {
          '&:has([data-likec4-icon])': {
            flexDirection: 'column',
            [textAlign]: 'center',
            '& .likec4-element-node-content': {
              minWidth: 'unset',
              alignItems: 'center',
            },
          },
        },
        icon: {
          alignSelf: 'center',
        },
      }),
      right: parts({
        root: {
          '&:has([data-likec4-icon])': {
            flexDirection: 'row-reverse',
            [textAlign]: 'right',
            '& .likec4-element-node-content': {
              alignItems: 'flex-end',
            },
          },
        },
      }),
      bottom: parts({
        root: {
          '&:has([data-likec4-icon])': {
            flexDirection: 'column-reverse',
            [textAlign]: 'center',
            '& .likec4-element-node-content': {
              minWidth: 'unset',
              alignItems: 'center',
            },
          },
        },
        icon: {
          alignSelf: 'center',
        },
      }),
      left: parts({
        root: {
          '&:has([data-likec4-icon])': {
            [textAlign]: 'left',
            gap: '4',

            '& .likec4-element-node-content': {
              minWidth: `calc(50% + ${__v('icon.size')})`,
              alignItems: 'flex-start',
            },
          },
        },
      }),
    },
  },
  defaultVariants: {
    iconPosition: 'left',
  },
  staticCss: [{
    iconPosition: ['*'],
    conditions: ['*'],
  }],
})
