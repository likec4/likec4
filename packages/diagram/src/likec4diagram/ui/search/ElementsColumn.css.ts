import { css } from '@likec4/styles/css'
import { container } from '@likec4/styles/patterns'
import { button, description, descriptionColor, iconColor, title } from './_shared.css'

export { focusable } from './_shared.css'

const whenContainerIsNarrow = `@container likec4-tree (max-width: 450px)`

export const treeNode = css({
  outline: 'none',
  marginBottom: 8,
})
export const treeRoot = css(
  container.raw({
    containerName: 'likec4-tree',
  }),
  {
    overflow: 'hidden',
    containerType: 'inline-size',
    height: '100%',
  },
)
export const treeLabel = css({
  display: 'flex',
  alignItems: 'baseline',
  outline: 'none !important',
  gap: 4,
})
export const treeSubtree = css({
  marginTop: 8,
})

const iconSize = '--likec4-icon-size'
export const elementExpandIcon = css({
  color: 'mantine.colors.dimmed',
})

export const elementButton = css(button, {
  flexGrow: 1,
})

// TODO
// globalStyle(`${treeNode}:focus > ${treeLabel} ${elementButton}`, buttonFocused)

export const elementTitleAndId = css({
  [whenContainerIsNarrow]: {
    flexDirection: 'column-reverse',
    alignItems: 'flex-start',
    gap: 2,
  },
})

export const elementTitle = css(title)
export const elementId = css({
  color: `[var(${descriptionColor}, {colors.mantine.colors.dimmed})]`,
  fontSize: 10,
  lineHeight: 1.3,
  display: 'block',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  padding: '1px 5px',
  borderRadius: 4,
  background: `mantine.colors.dark[9]/30`,
  _light: {
    background: `mantine.colors.gray[3]/20`,
  },
})
export const elementDescription = css(description)

const iconSizeVar = `var(${iconSize}, 32px)`
export const elementIcon = css({
  flex: `0 0 ${iconSizeVar}`,
  height: iconSizeVar,
  width: iconSizeVar,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'flex-start',
  marginTop: 4,
  [`& svg, & img`]: {
    width: '100%',
    height: 'auto',
    maxHeight: '100%',
    pointerEvents: 'none',
  },
  [`& img`]: {
    objectFit: 'contain',
  },
  '&.likec4-shape-icon svg': {
    color: `[var(${iconColor})]`,
    width: '90%',
    strokeWidth: 1.5,
  },
  [iconSize]: '24px',
  [whenContainerIsNarrow]: {
    [iconSize]: '18px',
  },
})

export const elementViewsCount = css({
  flex: 0,
  color: `[var(${descriptionColor}, {colors.mantine.colors.dimmed})]`,
  fontSize: '10px',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  lineHeight: '1.1',
  [whenContainerIsNarrow]: {
    display: 'none',
  },
})
