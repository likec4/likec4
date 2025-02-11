import { createContainer, createGlobalVar, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../../../theme-vars'
import { whereLight } from '../../../theme-vars.css'
import { button, buttonFocused, description, descriptionColor, iconColor, title } from './_shared.css'

export { focusable } from './_shared.css'

export const treeContainer = createContainer('likec4-elements-tree')

const whenContainerIsNarrow = `${treeContainer} (width < 450px)`

export const treeNode = style({
  outline: 'none',
  marginBottom: 8,
})
export const treeRoot = style({
  overflow: 'hidden',
  containerName: treeContainer,
  containerType: 'inline-size',
  height: '100%',
})
export const treeLabel = style({
  display: 'flex',
  alignItems: 'baseline',
  outline: 'none !important',
  gap: 4,
})
export const treeSubtree = style({
  marginTop: 8,
})

export const iconSize = createGlobalVar('likec4-icon-size')
export const elementExpandIcon = style({
  color: mantine.colors.dimmed,
})

export const elementButton = style([button, {
  flexGrow: 1,
  vars: {
    [iconSize]: '24px',
  },
  '@container': {
    [`${whenContainerIsNarrow}`]: {
      vars: {
        [iconSize]: '18px',
      },
    },
  },
}])

globalStyle(`${treeNode}:focus > ${treeLabel} ${elementButton}`, buttonFocused)

export const elementTitleAndId = style({
  '@container': {
    [`${whenContainerIsNarrow}`]: {
      flexDirection: 'column-reverse',
      alignItems: 'flex-start',
      gap: 2,
    },
  },
})

export const elementTitle = style([title])
export const elementId = style({
  color: fallbackVar(descriptionColor, mantine.colors.dimmed),
  fontSize: 10,
  lineHeight: 1.3,
  display: 'block',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  padding: '1px 5px',
  borderRadius: 4,
  background: `color-mix(in srgb, ${mantine.colors.dark[9]}, transparent 70%)`,
  selectors: {
    [`${whereLight} &`]: {
      backgroundColor: `color-mix(in srgb, ${mantine.colors.gray[3]}, transparent 80%)`,
    },
  },
})
export const elementDescription = style([description])

export const elementIcon = style({
  flex: `0 0 ${iconSize}`,
  height: iconSize,
  width: iconSize,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'flex-start',
  marginTop: 4,
})
globalStyle(`${elementIcon} svg, ${elementIcon} img`, {
  width: '100%',
  height: 'auto',
  maxHeight: '100%',
  pointerEvents: 'none',
})
globalStyle(`${elementIcon} img`, {
  objectFit: 'contain',
})
globalStyle(`${elementIcon}.likec4-shape-icon svg`, {
  color: iconColor,
  width: '90%',
  strokeWidth: 1.5,
})

export const elementViewsCount = style({
  flex: 0,
  color: fallbackVar(descriptionColor, mantine.colors.dimmed),
  fontSize: 10,
  fontWeight: 500,
  whiteSpace: 'nowrap',
  lineHeight: 1.1,
  '@container': {
    [`${whenContainerIsNarrow}`]: {
      display: 'none',
    },
  },
})
