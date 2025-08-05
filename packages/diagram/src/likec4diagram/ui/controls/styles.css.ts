import { css } from '@likec4/styles/css'

export const navigationButtons = css({
  gap: 'xxs',
  _empty: {
    display: 'none',
  },
})

export const panel = css({
  top: 'md',
  left: 'md',
  margin: '0',
  pointerEvents: 'none',
  '& :where(button, .action-icon, [role=\'dialog\'])': {
    pointerEvents: 'all',
  },
  ['& .action-icon']: {
    ['--ai-size']: '2rem',
  },
  ['& .tabler-icon']: {
    width: '65%',
    height: '65%',
  },
  _reduceGraphics: {
    '& .action-icon': {
      '--ai-radius': '0px',
    },
  },
})

export const actionIconGroup = css({
  shadow: {
    base: 'md',
    _whenPanning: 'none',
  },
})

export const autolayoutIcon = css({
  ['& .tabler-icon']: {
    width: '65%',
    height: '65%',
  },
})

export const autolayoutButton = css({
  flex: '1 1 40%',
  textAlign: 'center',
  fontWeight: 500,
  padding: '[4px 6px]',
  fontSize: '11px',
  zIndex: 1,
})

export const autolayoutIndicator = css({
  background: 'mantine.colors.gray[2]',
  borderRadius: 'sm',
  border: `1px solid`,
  borderColor: 'mantine.colors.gray[4]',
  _dark: {
    background: 'mantine.colors.dark[5]',
    borderColor: 'mantine.colors.dark[4]',
  },
})

export const spacingSliderBody = css({
  position: 'relative',
  borderRadius: 'sm',
  background: 'mantine.colors.gray[3]',
  boxShadow: 'inset 1px 1px 3px 0px #00000024',
  _dark: {
    background: 'mantine.colors.dark[7]',
  },
})

export const spacingSliderThumb = css({
  position: 'absolute',
  width: 8,
  height: 8,
  border: `2px solid`,
  borderColor: 'mantine.colors.gray[5]',
  borderRadius: 3,
  transform: 'translate(-50%, -50%)',
})
