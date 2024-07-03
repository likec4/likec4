import { fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../mantine.css'
import { vars } from '../theme.css'

export const panel = style({
  top: fallbackVar(vars.navigationPanel.top, '0.8rem'),
  left: fallbackVar(vars.navigationPanel.left, '1rem'),
  margin: 0
})

globalStyle(`${panel} .mantine-ActionIcon-root`, {
  vars: {
    ['--ai-size']: 'var(--ai-size-lg)'
  }
  // '@media': {
  //   [mantine.largerThan('lg')]: {
  //     vars: {
  //       ['--ai-size']: 'var(--ai-size-xl)'
  //     }
  //   }
  // }
})
