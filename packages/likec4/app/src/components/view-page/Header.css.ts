import { style } from '@vanilla-extract/css'
import { mantine } from '../../mantine.css'

export const cssHeader = style({
  position: 'absolute',
  backgroundColor: `color-mix(in srgb, ${mantine.colors.body}, transparent 20%)`,
  WebkitBackdropFilter: 'blur(3px)',
  backdropFilter: 'blur(3px)',
  selectors: {
    [`:where([data-mantine-color-scheme='dark']) &`]: {
      backgroundColor: `color-mix(in srgb, ${mantine.colors.dark[6]}, transparent 20%)`,
    },
  },
  // paddingLeft: 60,
  // paddingRight: 20,ody,
  // overflow: 'hidden'
  // border-bottom: rem(1px) solid light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-4));
})
