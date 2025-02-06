import { rem } from '@mantine/core'
import { globalStyle, style } from '@vanilla-extract/css'
import { vars, whereLight } from '../../../theme-vars'

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
    [`.likec4-compound-node:has(.compound-action) &`]: {
      paddingLeft: 30,
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
  //
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

const iconSize = '20px'
export const icon = style({
  flex: `0 0 ${iconSize}`,
  height: `${iconSize}`,
  width: `${iconSize}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  mixBlendMode: 'hard-light',
})

globalStyle(`${icon} svg, ${icon} img`, {
  width: '100%',
  height: 'auto',
  maxHeight: '100%',
  pointerEvents: 'none',
  filter: `
    drop-shadow(0 0 3px rgb(0 0 0 / 12%))
    drop-shadow(0 1px 8px rgb(0 0 0 / 8%))
    drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))
  `,
})
globalStyle(`${icon} img`, {
  objectFit: 'contain',
})
