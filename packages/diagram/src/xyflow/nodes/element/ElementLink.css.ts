import { globalStyle, style } from '@vanilla-extract/css'
import { vars } from '../../../theme.css'

export const elementLink = style({
  position: 'absolute',
  left: 0,
  bottom: 0,
  paddingLeft: 6,
  paddingBottom: 6,
  pointerEvents: 'all',
  selectors: {
    ':where([data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      bottom: 6
    },
    ':where([data-likec4-shape="queue"]) &': {
      left: 12,
      bottom: -3
    }
  }
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
  paddingLeft: 4,
  paddingRight: 5,
  borderRadius: 3,
  backgroundColor: `color-mix(in srgb, ${vars.element.stroke}, transparent 20%)`,
  transition: 'all 180ms ease-out',
  opacity: 0.85,
  ':hover': {
    color: vars.element.hiContrast,
    backgroundColor: vars.element.stroke,
    opacity: 1
  }
})

globalStyle(`${trigger} .icon`, {
  display: 'inline-block',
  lineHeight: 1,
  width: 10,
  height: 10,
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
