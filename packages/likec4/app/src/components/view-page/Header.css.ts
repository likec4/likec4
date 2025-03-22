import { css } from '@likec4/styles/css'

export const cssHeader = css({
  position: 'absolute',
  backgroundColor: `mantine.colors.body/80`,
  backdropFilter: 'blur(3px)',
  _dark: {
    backgroundColor: `mantine.colors.dark[6]/80`,
  },
  [`#likec4-root:has([data-likec4-reduced-graphics='true']) &`]: {
    boxShadow: 'none',
    borderRadius: '0px',
    backgroundColor: `mantine.colors.body`,
    backdropFilter: 'none',
  },
  // paddingLeft: 60,
  // paddingRight: 20,ody,
  // overflow: 'hidden'
  // border-bottom: rem(1px) solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4));
})
