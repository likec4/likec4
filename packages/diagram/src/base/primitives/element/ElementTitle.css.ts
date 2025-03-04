import { rem } from '@mantine/core'
import { createVar, globalStyle, style } from '@vanilla-extract/css'
import { calc } from '@vanilla-extract/css-utils'
import { vars } from '../../../theme-vars'
import { iconSize, paddingSize, textSize } from './vars.css'

export const hasIcon = style({})

const textAlign = createVar('text-align')

export { iconSize, paddingSize, textSize }

export const title = style({
  flex: '0 0 auto',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  textAlign: textAlign,
  fontWeight: 500,
  fontSize: textSize,
  lineHeight: 1.15,
  textWrap: 'balance',
  color: vars.element.hiContrast,
  whiteSpaceCollapse: 'preserve-breaks',
})

export const description = style({
  flex: '0 1 auto',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: calc(textSize).multiply(0.74).toString(),
  lineHeight: 1.2,
  textAlign: textAlign,
  textWrap: 'pretty',
  color: vars.element.loContrast,
  whiteSpaceCollapse: 'preserve-breaks',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  selectors: {
    [`:where([data-likec4-shape-size="xs"]) &`]: {
      display: 'none',
    },
  },
})

export const technology = style({
  flex: '0 0 auto',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: calc(textSize).multiply(0.635).toString(),
  lineHeight: 1.125,
  textAlign: textAlign,
  textWrap: 'balance',
  opacity: 0.92,
  color: vars.element.loContrast,
  selectors: {
    [`:where([data-hovered='true']) &`]: {
      opacity: 1,
    },
    [`:where([data-likec4-shape-size="xs"], [data-likec4-shape-size="sm"]) &`]: {
      display: 'none',
    },
  },
})

export const elementDataContainer = style({
  flex: '1',
  height: 'fit-content',
  width: 'fit-content',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  paddingTop: paddingSize,
  paddingBottom: paddingSize,
  paddingLeft: calc(paddingSize).add('8px').toString(),
  paddingRight: calc(paddingSize).add('8px').toString(),
  overflow: 'hidden',
  gap: rem(12),
  selectors: {
    ':where([data-likec4-shape="queue"], [data-likec4-shape="mobile"]) &': {
      paddingLeft: 46,
      paddingRight: 16,
    },
    ':where([data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      paddingTop: 30,
    },
    ':where([data-likec4-shape="browser"]) &': {
      paddingTop: 32,
      paddingBottom: 28,
    },
  },
})
globalStyle(`:where([data-likec4-shape-size="lg"], [data-likec4-shape-size="xl"]) ${elementDataContainer}`, {
  gap: rem(16),
})

export const elementTextData = style({
  height: 'fit-content',
  width: 'fit-content',
  flex: '0 1 auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'center',
  flexWrap: 'nowrap',
  overflow: 'hidden',
  gap: rem(8),
  'vars': {
    [textAlign]: 'center',
  },
  selectors: {
    [`&:has(${description}):has(${technology})`]: {
      gap: rem(6),
    },
    [`:where(${hasIcon}) &`]: {
      minWidth: `calc(50% + ${iconSize})`,
      alignItems: 'flex-start',
      'vars': {
        [textAlign]: 'left',
      },
    },
  },
})

export const elementIcon = style({
  flex: `0 0 ${iconSize}`,
  height: iconSize,
  width: iconSize,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  mixBlendMode: 'hard-light',
  alignSelf: 'flex-start',
})
globalStyle(`${elementIcon} svg, ${elementIcon} img`, {
  width: '100%',
  height: 'auto',
  maxHeight: '100%',
  pointerEvents: 'none',
  filter: `
    drop-shadow(0 0 3px rgb(0 0 0 / 12%))
    drop-shadow(0 1px 8px rgb(0 0 0 / 8%))
    drop-shadow(1px 1px 16px rgb(0 0 0 / 3%))
  `,
})
globalStyle(`${elementIcon} img`, {
  objectFit: 'contain',
})
