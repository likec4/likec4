import { style } from '@vanilla-extract/css'
import { mantine, whereLight } from '../../../mantine'

export const handleCenter = style({
  top: '50%',
  left: '50%',
  visibility: 'hidden',
})

export const toplevelNode = style({
  backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[6]} 40%, ${mantine.colors.dark[7]})`,
  borderColor: mantine.colors.dark[6],
  transition: 'all 100ms ease-in 20ms',
  willChange: 'background-color, border-color',
  ':hover': {
    backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[6]} 60%, ${mantine.colors.dark[7]})`,
    borderColor: mantine.colors.dark[5],
    transition: 'all 120ms ease-in-out 50ms',
  },
  selectors: {
    [`${whereLight} &`]: {
      backgroundColor: mantine.colors.body,
      borderColor: mantine.colors.gray[2],
    },
    [`${whereLight} &:hover`]: {
      backgroundColor: `color-mix(in srgb, ${mantine.colors.body} 40%, ${mantine.colors.gray[1]})`,
      borderColor: mantine.colors.gray[4],
    },
    [`:where(.react-flow__node.selected) &`]: {
      borderColor: `${mantine.colors.primaryColors.filled} !important`,
      borderWidth: 2,
    },
  },
})

export const nestedNode = style({
  backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[5]} 25%, transparent)`,
  borderColor: `color-mix(in srgb, ${mantine.colors.dark[4]} 50%, transparent)`,
  transition: 'all 120ms ease-in 0ms',
  willChange: 'background-color, border-color',
  ':hover': {
    backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[5]} 35%, transparent)`,
    borderColor: `color-mix(in srgb, ${mantine.colors.dark[4]} 60%, transparent)`,
    transition: 'all 150ms ease-in-out 50ms',
  },
  selectors: {
    [`${whereLight} &`]: {
      backgroundColor: `color-mix(in srgb, ${mantine.colors.gray[4]} 20%, transparent)`,
      borderColor: mantine.colors.gray[2],
    },
    [`${whereLight} &:hover`]: {
      backgroundColor: `color-mix(in srgb, ${mantine.colors.gray[4]} 30%, transparent)`,
      borderColor: mantine.colors.gray[4],
    },
    [`:where(.react-flow__node.selected) &`]: {
      borderColor: `${mantine.colors.primaryColors.filled} !important`,
      borderWidth: 2,
    },
  },
})

export const dimmed = style({
  willChange: 'opacity',
  opacity: 0,
  transition: 'all 500ms ease-in !important',
})

export const folderNode = style({
  width: '100%',
  height: '100%',
  borderWidth: 3,
})

export const fileNode = style({
  width: '100%',
  height: '100%',
  borderWidth: 3,
})

export const viewNode = style({
  width: '100%',
  height: '100%',
  backgroundColor: mantine.colors.gray[7],
  borderColor: mantine.colors.gray[8],
  transition: 'all 120ms ease-in-out',
  cursor: 'pointer',
  ':hover': {
    // borderColor: `color-mix(in srgb, ${mantine.colors.gray[6]} 50%, transparent)`,
    borderColor: mantine.colors.gray[6],
  },
  selectors: {
    [`${whereLight} &`]: {
      backgroundColor: mantine.colors.gray[3],
      borderColor: mantine.colors.gray[5],
    },
    [`${whereLight} &:hover`]: {
      backgroundColor: `color-mix(in srgb, ${mantine.colors.gray[4]} 60%, ${mantine.colors.gray[5]})`,
      borderColor: mantine.colors.gray[6],
    },
    [`:where(.react-flow__node.selected) &`]: {
      borderColor: `${mantine.colors.primaryColors.filled} !important`,
      borderWidth: 2,
    },
  },
  // backgroundColor: mantine.colors.dark[7]
})

export const viewNodeImageSection = style({
  pointerEvents: 'none',
  backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[7]} 80%, transparent)`,
  // backgroundColor: mantine.colors.dark[5],
  selectors: {
    [`${viewNode}:hover &`]: {
      backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[7]} 60%, transparent)`,
    },
    [`${whereLight} &`]: {
      backgroundColor: mantine.colors.gray[0],
      // backgroundColor: `color-mix(in srgb, ${mantine.colors.gray[2]} 50%, transparent)`
    },
    [`${whereLight} ${viewNode}:hover &`]: {
      backgroundColor: mantine.colors.gray[1],
    },
  },
})

export const viewTitle = style({
  display: 'flex',
  alignItems: 'center',
})
