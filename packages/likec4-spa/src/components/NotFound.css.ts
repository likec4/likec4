import { css } from '@likec4/styles/css'

export const content = css({
  paddingTop: '[120px]',
  position: 'relative',
  zIndex: '1',
  sm: {
    paddingTop: '[220px]',
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
  paddingTop: '[80px]',
  paddingBottom: '[80px]',
})

export const description = css({
  maxWidth: '[540px]',
  margin: 'auto',
  marginTop: 'xl',
  marginBottom: '[calc({spacing.xl}*1.5)]',
})

export const title = css({
  textAlign: 'center',
  fontWeight: '[900]',
  fontSize: `[38px]`,
})
