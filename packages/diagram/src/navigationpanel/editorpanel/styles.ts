import { css } from '@likec4/styles/css'

export const autolayoutButton = css({
  flex: '[1 1 40%]',
  textAlign: 'center',
  fontWeight: 'medium',
  padding: '[4px 6px]',
  fontSize: '[11px]',
  zIndex: 'base',
})

export const autolayoutIndicator = css({
  background: 'mantine.gray[2]',
  borderRadius: 'sm',
  border: `default`,
  borderColor: 'mantine.gray[4]',
  _dark: {
    background: 'mantine.dark[5]',
    borderColor: 'mantine.dark[4]',
  },
})

export const spacingSliderBody = css({
  position: 'relative',
  borderRadius: 'sm',
  background: 'mantine.gray[3]',
  boxShadow: '[inset 1px 1px 3px 0px #00000024]',
  _dark: {
    background: 'mantine.dark[7]',
  },
})

export const spacingSliderThumb = css({
  position: 'absolute',
  boxSize: '[8px]',
  border: `strong`,
  borderColor: 'mantine.gray[5]',
  borderRadius: 'sm',
  transform: 'translate(-50%, -50%)',
})
