import { css } from '@likec4/styles/css'
import { container } from '@likec4/styles/patterns'

export { focusable } from './_shared.css'

const whenContainerIsNarrow = `@container likec4-tree (max-width: 450px)`

export const treeNode = css({
  outline: 'none',
  marginBottom: '2',
})
export const treeRoot = css(
  container.raw({
    containerName: 'likec4-tree',
  }),
  {
    containerType: 'inline-size',
    height: '100%',
  },
)
export const treeLabel = css({
  display: 'flex',
  alignItems: 'baseline',
  outline: 'none !important',
  gap: '1',
})
export const treeSubtree = css({
  marginTop: '2',
})

export const elementExpandIcon = css({
  color: 'text.dimmed',
})

export const elementTitleAndId = css({
  [whenContainerIsNarrow]: {
    flexDirection: 'column-reverse',
    alignItems: 'flex-start',
    gap: '0.5',
  },
})

// export const elementTitle = css(title)
export const elementId = css({
  // color: `[var(${descriptionColor}, {colors.text.dimmed})]`,
  fontSize: '10px',
  lineHeight: '1.3',
  display: 'block',
  fontWeight: 'medium',
  whiteSpace: 'nowrap',
  padding: '[1px 5px]',
  borderRadius: 'sm',
  background: `mantine.colors.dark[9]/30`,
  _light: {
    background: `mantine.colors.gray[3]/20`,
  },
})

export const elementIcon = css({
  ['--likec4-icon-size']: '24px',
  [whenContainerIsNarrow]: {
    ['--likec4-icon-size']: '18px',
  },
})

export const elementViewsCount = css({
  flex: 0,
  // color: `[var(${descriptionColor}, {colors.text.dimmed})]`,
  fontSize: '10px',
  fontWeight: 'medium',
  whiteSpace: 'nowrap',
  lineHeight: '1.1',
  [whenContainerIsNarrow]: {
    display: 'none',
  },
})
