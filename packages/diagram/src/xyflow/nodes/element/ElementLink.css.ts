import { rem } from '@mantine/core'
import {
  assignVars,
  createVar,
  fallbackVar,
  generateIdentifier,
  globalKeyframes,
  globalStyle,
  style
} from '@vanilla-extract/css'
import { mantine, vars } from '../../../theme'
import { stokeFillMix } from './element.css'

export const elementLink = style({
  position: 'absolute',
  left: 0,
  bottom: 0,
  paddingLeft: 8,
  paddingBottom: 6
  // fontSize: rem(10),
  // height: 12,
  // width: ['100%', '-webkit-fill-available'],
  // height: ['100%', '-webkit-fill-available'],
  // vars: {
  //   [stokeFillMix]: `color-mix(in srgb, ${vars.element.stroke} 90%, ${vars.element.fill})`
  // }
})

export const trigger = style({
  display: 'flex',
  lineHeight: 0.75,
  fontSize: 11,
  alignItems: 'center',
  justifyContent: 'center',
  color: vars.element.loContrast,
  paddingTop: 2,
  paddingBottom: 2,
  paddingLeft: 5,
  paddingRight: 5,
  borderRadius: 4,
  backgroundColor: `color-mix(in srgb, ${vars.element.stroke}, transparent 20%)`,
  transition: 'all 180ms ease-out',
  opacity: 0.85,
  selectors: {
    '&:hover': {
      color: vars.element.hiContrast,
      backgroundColor: vars.element.stroke,
      opacity: 1
    }
  }
})

globalStyle(`${trigger} .icon`, {
  display: 'inline-block',
  lineHeight: 1,
  width: 11,
  height: 11,
  opacity: 0.6
})
globalStyle(`${trigger} span`, {
  display: 'inline-block',
  lineHeight: 1,
  marginLeft: 3
})

export const linkButton = style({
  textAlign: 'left'
})
