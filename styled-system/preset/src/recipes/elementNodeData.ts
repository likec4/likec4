import { defineParts, defineRecipe } from '@pandacss/dev'
import { iconSize } from '../const'

const parts = defineParts({
  root: { selector: '&' },
  icon: { selector: '& [data-likec4-icon]' },
  content: { selector: '& .likec4-element-node-content' },
  title: { selector: '& [data-likec4-node-title]' },
  description: { selector: '& [data-likec4-node-description]' },
  technology: { selector: '& [data-likec4-node-technology]' },
})

const varIconSize = `var(${iconSize}, 48px)`

const textAlign = '__text-align'
const varTextAlign = `var(${textAlign})`

export const elementNodeData = defineRecipe({
  className: 'likec4-element-node-data',
  jsx: ['ElementNodeData', 'ElementNodeData.Root', 'ElementTitle'],
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
      paddingTop: 'var(--likec4-spacing)',
      paddingBottom: 'var(--likec4-spacing)',
      paddingLeft: 'calc(var(--likec4-spacing) + 8px)',
      paddingRight: 'calc(var(--likec4-spacing) + 8px)',
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

      _shapeSizeXs: {
        [iconSize]: '24px',
      },
      _shapeSizeSm: {
        [iconSize]: '36px',
      },
      _shapeSizeMd: {
        [iconSize]: '60px',
      },
      _shapeSizeLg: {
        [iconSize]: '82px',
        gap: '4',
      },
      _shapeSizeXl: {
        [iconSize]: '90px',
        gap: '4',
      },

      [textAlign]: 'center',

      // When node has icon
      '&:has([data-likec4-icon])': {
        [textAlign]: 'left',
        gap: '4',

        '& .likec4-element-node-content': {
          minWidth: `calc(50% + var(${iconSize}))`,
          alignItems: 'flex-start',
        },
      },
    },
    icon: {
      flex: `0 0 ${varIconSize}`,
      height: varIconSize,
      width: varIconSize,
      display: 'flex',
      alignSelf: 'flex-start',
      alignItems: 'center',
      justifyContent: 'center',
      mixBlendMode: {
        base: 'hard-light',
        _reduceGraphicsOnPan: 'normal',
      },
      '& svg, & img': {
        width: '100%',
        height: 'auto',
        maxHeight: '100%',
        pointerEvents: 'none',
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
      color: 'var(--likec4-palette-hiContrast)',
    },
    description: {
      flexGrow: '0',
      flexShrink: '1',
      textStyle: 'likec4.node.secondary',
      color: 'var(--likec4-palette-loContrast)',
      textAlign: varTextAlign,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      _shapeSizeXs: {
        display: 'none',
      },
      _smallZoom: {
        display: 'none',
      },

      '& a': {
        pointerEvents: 'all',
      },
    },
    technology: {
      flex: '0 0 auto',
      textStyle: 'likec4.node.secondary',
      color: 'var(--likec4-palette-loContrast)',
      fontSize: `calc(var(--likec4-text-size) * 0.635)`,
      lineHeight: 1.125,
      textAlign: varTextAlign,
      textWrap: 'balance',
      opacity: 0.92,
      _whenHovered: {
        opacity: 1,
      },
      _shapeSizeXs: {
        display: 'none',
      },
      _shapeSizeSm: {
        display: 'none',
      },
      _smallZoom: {
        display: 'none',
      },
    },
  }),
  staticCss: [{
    conditions: ['*'],
  }],
})
