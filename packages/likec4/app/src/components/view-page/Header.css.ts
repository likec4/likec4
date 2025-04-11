import { css } from '@likec4/styles/css'

export const cssHeader = css({
  position: 'absolute',
  backgroundColor: `mantine.colors.body/80`,
  _dark: {
    backgroundColor: `mantine.colors.dark[6]/60`,
  },
  [`#likec4-root:has([data-likec4-diagram-panning]) &`]: {
    boxShadow: 'none',
    borderRadius: '0px',
    backgroundColor: `mantine.colors.body`,
  },
})
