import { css } from '@likec4/styles/css'

export const content = css({
  paddingTop: '120px',
  position: 'relative',
  zIndex: '1',
  border: 'none',
})

export const image = css({
  position: 'absolute',
  inset: '0',
  opacity: 0.2,
})

export const inner = css({
  position: 'relative',
})

export const root = css({
  paddingTop: '80px',
  paddingBottom: '80px',
})

export const description = css({
  maxWidth: 540,
  margin: 'auto',
  // marginTop: mantine.spacing.xl,
  // marginBottom: `calc(${mantine.spacing.xl}*1.5)`
})

export const title = css({
  // fontFamily: ['Greycliff CF', mantine.fontFamily],
  textAlign: 'center',
  fontWeight: '900',
  fontSize: 38,
})
