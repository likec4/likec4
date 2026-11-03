import { css } from '@likec4/styles/css'

export const fqn = css({
  display: 'inline-block',
  fontSize: 'sm',
  fontWeight: 'medium',
  whiteSpace: 'nowrap',
  padding: '[3px 6px]',
  borderRadius: 'xs',
  background: `var(--likec4-palette-fill)/75`,
  lineHeight: '[1.2]',
  color: 'var(--likec4-palette-hiContrast)',
})

export const relationshipStat = css({
  _light: {
    background: 'mantine.gray[1]',
    '&[data-missing': {},
  },
  [`&[data-missing]`]: {
    color: 'mantine.orange[4]',
    background: `mantine.orange[8]/15`,
    borderColor: `mantine.orange[5]/20`,
    _light: {
      color: 'mantine.orange[8]',
    },
  },
})

export const xyflow = css({
  flex: '[1 1 100%]',
  position: 'relative',
  width: '100%',
  height: '100%',
  background: 'surface.sunken',
  border: 'default',
  borderRadius: 'sm',
  // _light: {
  //   borderColor: 'mantine.gray[3]',
  //   background: 'mantine.gray[1]',
  // },
})
