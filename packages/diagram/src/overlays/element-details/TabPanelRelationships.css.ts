import { css } from '@likec4/styles/css'

export const fqn = css({
  display: 'inline-block',
  fontSize: 'sm',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  padding: '3px 6px',
  borderRadius: 3,
  background: `likec4.element.fill/75`,
  lineHeight: 1.2,
  color: 'likec4.element.hiContrast',
  // selectors: {
  //   [`${whereDark} &`]: {
  //   }
  // }
})

export const relationshipStat = css({
  _light: {
    background: 'mantine.colors.gray[1]',
    '&[data-missing': {},
  },
  // [`&[data-zero]`]: {
  //   color: mantine.colors.dimmed
  // },
  // [`${whereLight} &[data-zero]`]: {
  //   background: mantine.colors.gray[3]
  // },
  [`&[data-missing]`]: {
    color: 'mantine.colors.orange[4]',
    background: `mantine.colors.orange[8]/15`,
    borderColor: `mantine.colors.orange[5]/20`,
    _light: {
      color: 'mantine.colors.orange[8]',
    },
  },
})

export const xyflow = css({
  flex: '1 1 100%',
  position: 'relative',
  width: '100%',
  height: '100%',
  background: 'mantine.colors.body',
  border: `1px solid {colors.mantine.colors.defaultBorder}`,
  borderRadius: 'sm',
  _light: {
    borderColor: 'mantine.colors.gray[3]',
    background: 'mantine.colors.gray[1]',
  },
})

export const panelScope = css({
  _before: {
    content: '"scope:"',
    position: 'absolute',
    top: 0,
    left: 8,
    fontSize: '2xs',
    fontWeight: 500,
    lineHeight: '1',
    color: 'mantine.colors.dimmed',
    opacity: 0.85,
    transform: 'translateY(-100%) translateY(-2px)',
  },
  _light: {
    '& .mantine-SegmentedControl-root': {
      background: 'mantine.colors.gray[3]',
    },
  },
})

export const edgeNum = css({
  display: 'inline-block',
  fontSize: 'xl',
  fontWeight: 600,
  padding: '1px 5px',
  minWidth: 24,
  textAlign: 'center',
  borderRadius: 'sm',
  background: 'mantine.colors.dark[7]',
  color: 'mantine.colors.defaultColor',
  [`&[data-zero]`]: {
    color: 'mantine.colors.dimmed',
  },
  [`&[data-missing]`]: {
    color: 'mantine.colors.orange[4]',
    background: `mantine.colors.orange[8]/20`,
  },
  // _light: {
  //   background: 'mantine.colors.gray[4]',
  //   color: 'mantine.colors.dark[6]',

  //   [`&[data-zero]`]: {
  //     background: 'mantine.colors.gray[3]',
  //   },
  //   [`&[data-missing]`]: {
  //     color: 'mantine.colors.orange[8]',
  //   },
  // },
})
