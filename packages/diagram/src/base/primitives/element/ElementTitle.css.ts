import { rem } from '@mantine/core'
import { createVar, globalStyle, style } from '@vanilla-extract/css'
import { vars } from '../../../theme-vars'

export const hasIcon = style({})

const textAlign = createVar('text-align')
export const iconSize = createVar('icon-size')

export const title = style({
  flex: '0 0 auto',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  textAlign: textAlign,
  fontWeight: 500,
  fontSize: 19,
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
  fontSize: 14,
  lineHeight: 1.2,
  textAlign: textAlign,
  textWrap: 'pretty',
  color: vars.element.loContrast,
  whiteSpaceCollapse: 'preserve-breaks',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
  selectors: {
    [`:where(${hasIcon}) &`]: {
      textWrap: 'wrap',
    },
  },
})

export const technology = style({
  flex: '0 0 auto',
  fontFamily: vars.element.font,
  fontOpticalSizing: 'auto',
  fontStyle: 'normal',
  fontWeight: 400,
  fontSize: 12,
  lineHeight: 1.125,
  textAlign: textAlign,
  textWrap: 'balance',
  opacity: 0.92,
  color: vars.element.loContrast,
  selectors: {
    [`:where([data-hovered='true']) &`]: {
      opacity: 1,
    },
  },
})

export const elementDataContainer = style({
  flex: '1',
  height: 'fit-content',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  padding: rem(24),
  overflow: 'hidden',
  gap: rem(10),
  vars: {
    [iconSize]: '48px',
  },
  selectors: {
    ':where([data-likec4-shape="queue"], [data-likec4-shape="mobile"]) &': {
      paddingLeft: 40,
      paddingRight: 20,
    },
    ':where([data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      paddingTop: 30,
    },
    ':where([data-likec4-shape="browser"]) &': {
      paddingTop: 32,
      paddingBottom: 28,
    },
    // [`&:is(${hasIcon})`]: {
    //   paddingLeft: 40,
    //   paddingRight: 20
    // },
    [`.likec4-element-node:not(:is([data-likec4-shape="queue"],[data-likec4-shape="mobile"])) &:is(${hasIcon})`]: {
      paddingLeft: 24,
      paddingRight: 18,
    },
    [`&:has(${description}, ${technology})`]: {
      gap: rem(16),
      vars: {
        [iconSize]: '60px',
      },
    },
  },
})

export const elementTextData = style({
  height: 'fit-content',
  width: 'max-content',
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
      minWidth: 'calc(100% - 160px)',
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
