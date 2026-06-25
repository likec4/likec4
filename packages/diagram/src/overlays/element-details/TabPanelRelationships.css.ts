import { css } from '@likec4/styles/css'

export const fqn = css({
  display: 'inline-block',
  fontSize: 'sm',
  fontWeight: 'medium',
  whiteSpace: 'nowrap',
  padding: '[3px 6px]',
  borderRadius: 'xs',
  background: `var(--likec4-palette-fill)/75`,
  lineHeight: 1.2,
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
  flex: '1 1 100%',
  position: 'relative',
  width: '100%',
  height: '100%',
  background: 'body',
  border: 'default',
  borderRadius: 'sm',
  _light: {
    borderColor: 'mantine.gray[3]',
    background: 'mantine.gray[1]',
  },
})

export const panelScope = css({
  _before: {
    content: '"scope:"',
    position: 'absolute',
    top: '0',
    left: '2',
    fontSize: 'xxs',
    fontWeight: 'medium',
    lineHeight: '1',
    color: 'text.dimmed',
    opacity: 0.85,
    transform: 'translateY(-100%) translateY(-2px)',
  },
  _light: {
    '& .mantine-SegmentedControl-root': {
      background: 'mantine.gray[3]',
    },
  },
})

export const edgeNum = css({
  display: 'inline-block',
  fontSize: 'xl',
  fontWeight: 'bold',
  padding: '[1px 5px]',
  minWidth: '24px',
  textAlign: 'center',
  borderRadius: 'sm',
  background: 'mantine.dark[7]',
  color: 'default.color',
  [`&[data-zero]`]: {
    color: 'text.dimmed',
  },
  [`&[data-missing]`]: {
    color: 'mantine.orange[4]',
    background: `mantine.orange[8]/20`,
  },
})
