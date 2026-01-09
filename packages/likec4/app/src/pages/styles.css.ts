import { css } from '@likec4/styles/css'

export const svgContainer = css({
  minWidth: 300,
  '& svg': {
    width: '100%',
    height: 'auto',
  },
})

export const cssScrollArea = css({
  height: '100%',
  '& .mantine-ScrollArea-viewport': {
    minHeight: '100%',
  },
  '& .mantine-ScrollArea-viewport > div': {
    minHeight: '100%',
    height: '100%',
  },
})

export const cssCodeBlock = css({
  minHeight: '100%',
})

export const viewWithTopPadding = css({
  height: '100%',
  paddingTop: '[var(--header-height)]',
})
