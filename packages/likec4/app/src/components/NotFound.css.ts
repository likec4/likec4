import { css } from '@likec4/styles/css'
import { rem } from '@mantine/core'

export const content = css({
  paddingTop: 120,
  position: 'relative',
  zIndex: '1',
  sm: {
    paddingTop: 220,
  },
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
  maxWidth: rem(540),
  margin: 'auto',
  marginTop: 'xl',
  marginBottom: `calc({spacing.xl}*1.5)`,
})

export const title = css({
  textAlign: 'center',
  fontWeight: '900',
  fontSize: rem(38),
})
