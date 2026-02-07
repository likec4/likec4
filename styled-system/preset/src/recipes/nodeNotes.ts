import { defineParts, defineRecipe, defineStyles } from '@pandacss/dev'
import { __v } from '../const.ts'

const parts = defineParts({
  root: { selector: '&' },
  indicator: { selector: '& .likec4-node-notes__indicator' },
})

const paper = defineStyles({
  pointerEvents: 'visible',
  transitionTimingFunction: 'in',
  transitionDuration: '130ms',
  transitionDelay: '30ms',
  content: '" "',
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  border: '1px solid var(--paper-border)',
  background: 'var(--paper-bg)',
  zIndex: -1,
})

export const nodeNotes = defineRecipe({
  className: 'likec4-node-notes',
  jsx: ['NodeNotes'],
  base: parts({
    root: {
      display: 'contents',
    },
    indicator: {
      pointerEvents: 'all ',
      position: 'absolute',
      top: '-8px',
      left: '40px',
      width: '110px',
      height: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      _before: {
        ...paper as any,
        transform: 'rotateZ(-3.5deg) scale(1.05) translate(-6px, -1px)',
        background: 'oklch(from var(--paper-bg) calc(l - 0.05) c h)',
        boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.2), 1px 1px 5px -1px rgba(0, 0, 0, 0.2)',
      },
      _after: {
        ...paper as any,
        fontSize: '9px',
        paddingTop: '4px',
        textDecorationStyle: 'solid',
        textUnderlineOffset: '3px',
        textDecorationLine: 'underline',
        textDecorationThickness: '2px',
        paddingLeft: '10px',
        fontWeight: '700',
        lineHeight: '16px',
        color: '#000',
        transform: 'rotateZ(2.5deg) scale(1.05) translate(2px, 0px)',
        boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.2), 1px 1px 3px -1px rgba(0, 0, 0, 0.15)',
        content: '"NOTES"',
      },

      '--paper-border': {
        base: `color-mix(in oklab, ${__v('palette.stroke')} 20%, #BBB)`,
        _dark: `color-mix(in oklab, ${__v('palette.stroke')} 40%, #AAA)`,
      },
      '--paper-bg': {
        base: `color-mix(in oklab, ${__v('palette.fill')} 10%, #DDD)`,
        _dark: `color-mix(in oklab, ${__v('palette.fill')} 30%, #DDD)`,
      },

      _whenHovered: {
        '--paper-border': `color-mix(in oklab, ${__v('palette.stroke')} 5%, #BBB)`,
        '--paper-bg': `color-mix(in oklab, ${__v('palette.fill')} 5%, #FFF)`,

        _before: {
          transitionDelay: '50ms',
          transform: 'rotateZ(-5deg) scale(1.15) translate(-5px, -6px)',
        },

        _after: {
          transitionDelay: '50ms',
          transform: 'rotateZ(2.5deg) scale(1.15) translate(2px, -4px)',
        },
      },

      _hover: {
        _before: {
          transitionDelay: '0ms',
          transform: 'rotateZ(-5.3deg) scale(1.2) translate(-8px, -10px)',
        },
        _after: {
          transitionDelay: '0ms',
          transform: 'rotateZ(2.6deg) scale(1.3) translate(2px, -12px)',
        },
      },
    },
  }),
  variants: {},
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
