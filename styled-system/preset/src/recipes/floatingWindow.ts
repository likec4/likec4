import { defineParts, defineRecipe } from '@pandacss/dev'

const parts = defineParts({
  root: { selector: '&' },
  dragHeader: { selector: '& .drag-header' },
  // resizer: { selector: '& [data-resize-handler]' },
})

export const floatingWindow = defineRecipe({
  description: 'Recipe for Floating Window',
  className: 'likec4-floating-window',
  jsx: [
    'FloatingWindow',
  ],
  base: parts({
    root: {
      display: 'flex',
      alignItems: 'stretch',
      justifyContent: 'stretch',
      flexDirection: 'column',
      p: 'xs',
      pt: '18px',
      gap: '0',
      background: 'likec4.overlay.body',
      border: 'default',
      borderColor: 'likec4.overlay.border',
      rounded: 'md',
      shadow: 'lg',
      zIndex: 'floating',
      overflow: 'hidden',
      // overflowClipMargin: 'border-box',
      '& .drag-handle': {
        cursor: 'move',
      },

      transitionProperty: 'transform',
      transitionDuration: 'fast',
      transitionTimingFunction: 'inOut',
      transitionDelay: '0ms',
      transformOrigin: 'top center',
      '&:is([data-dragging="true"])': {
        shadow: 'xl',
        transitionDelay: '200ms',
        transform: 'translateY(-5px) scale(1.005)',

        '& *': {
          userSelect: 'none',
        },
      },

      '& [data-resize-handler]': {
        position: 'absolute',
        transition: 'fast',
        _hover: {
          backgroundColor: 'surface.hover',
        },
      },

      '& [data-resize-handler="right"]': {
        top: '16px',
        right: '0',
        height: 'calc(100% - 16px)',
        width: '[10px]',
        cursor: '[ew-resize]',
      },
      '& [data-resize-handler="bottom"]': {
        left: '0',
        bottom: '0',
        width: 'full',
        height: '[10px]',
        cursor: '[ns-resize]',
      },
    },
    dragHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'end',
      flexDirection: 'row',
      position: 'absolute',
      top: '0',
      left: '0',
      width: 'full',
      height: '[16px]',
      backgroundColor: {
        base: 'mantine.gray[2]',
        _dark: 'mantine.dark[8]',
      },
      cursor: 'move',
      borderBottom: 'default',
    },
  }),
  variants: {},
  defaultVariants: {},
  staticCss: ['*'],
})
