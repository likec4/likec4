import { rem } from '@mantine/core'
import { globalStyle, style } from '@vanilla-extract/css'
import { vars, whereLight } from '../../../theme-vars'
import { whereTransparent } from './compound.css'

export const compoundTitle = style({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  paddingLeft: 14,
  paddingTop: 6,
  minHeight: 30,
  paddingRight: 2,
  selectors: {
    [`:where(.react-flow__node.draggable) &`]: {
      cursor: 'grab',
    },
  },
})

export const title = style({
  flex: 1,
  fontFamily: vars.compound.font,
  fontWeight: 600,
  fontSize: rem(15),
  textTransform: 'uppercase',
  letterSpacing: '0.2px',
  // lineHeight: 1,
  color: `var(--_compound-title-color,${vars.compound.titleColor})`,
  // paddingLeft: 0,
  // paddingTop: 13,
  // paddingBottom: 6,
  // minHeight: 20,
  mixBlendMode: 'screen',
  selectors: {
    [`${whereLight} &`]: {
      mixBlendMode: 'darken',
    },
  },
})

globalStyle(`:where([data-mantine-color-scheme='light'] ${whereTransparent})`, {
  vars: {
    ['--_compound-title-color']: vars.element.stroke,
  },
})
