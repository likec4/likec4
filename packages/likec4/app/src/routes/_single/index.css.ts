import { css } from '@likec4/styles/css'

export const dimmed = css({
  color: 'mantine.colors.dimmed',
})

export const header = css({
  // background: 'var(--color-surface)',
})

export const previewBg = css({
  position: 'relative',
  overflow: 'hidden',
  padding: 0,
  margin: 0,
  backgroundOrigin: 'padding-box',
  backgroundImage: `radial-gradient({colors.mantine.colors.defaultBorder} 15%, {colors.mantine.colors.body} 15%)`,
  backgroundPosition: '0 0',
  backgroundSize: '12px 12px',
  _after: {
    content: '" "',
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    zIndex: '1',
  },
})

export const cardLink = css({
  position: 'absolute',
  inset: 0,
  zIndex: 5,
})
