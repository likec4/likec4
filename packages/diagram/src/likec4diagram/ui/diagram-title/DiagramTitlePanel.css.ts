import { css } from '@likec4/styles/css'

export const card = css({
  cursor: 'default',
  minWidth: 200,
  maxWidth: 'calc(100vw - 16px)',
  width: 'auto',
  backgroundColor: 'mantine.colors.body',
  borderRadius: '0px',
  sm: {
    minWidth: 250,
    maxWidth: '90vw',
  },
  md: {
    minWidth: 350,
    maxWidth: '70vw',
  },

  _dark: {
    backgroundColor: 'mantine.colors.dark[6]',
  },
  _noReduceGraphics: {
    borderRadius: 'sm',
    backgroundColor: `mantine.colors.body/80`,
    // WebkitBackdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
    // backdropFilter: fallbackVar(vars.safariAnimationHook, 'blur(8px)'),
    _dark: {
      backgroundColor: `mantine.colors.dark[6]/80`,
    },
  },
})

export const title = css({})

export const description = css({
  whiteSpaceCollapse: 'preserve-breaks',
  color: 'mantine.colors.gray[7]',
  _dark: {
    color: 'mantine.colors.gray[5]',
  },
})
