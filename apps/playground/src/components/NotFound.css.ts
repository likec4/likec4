import { style } from '@vanilla-extract/css'

export const content = style({
  paddingTop: 120,
  position: 'relative',
  zIndex: '1',
})

export const image = style({
  position: 'absolute',
  inset: '0',
  opacity: 0.2,
})

export const inner = style({
  position: 'relative',
})

export const root = style({
  paddingTop: '80px',
  paddingBottom: '80px',
})

export const description = style({
  maxWidth: 540,
  margin: 'auto',
  // marginTop: mantine.spacing.xl,
  // marginBottom: `calc(${mantine.spacing.xl}*1.5)`
})

export const title = style({
  // fontFamily: ['Greycliff CF', mantine.fontFamily],
  textAlign: 'center',
  fontWeight: '900',
  fontSize: 38,
})
