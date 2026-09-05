import { css } from '@likec4/styles/css'

export const node = css({
  margin: '0',
})

export const label = css({
  _hover: {
    backgroundColor: 'surface.hover',
    // backgroundColor: 'mantine.gray[0]',
    // _dark: {
    //   backgroundColor: 'mantine.gray[0]',
    //   color: 'white',
    // },
  },
})

export const scrollArea = css({
  maxHeight: [
    '70vh',
    'calc(100cqh - 70px)',
  ],
})
