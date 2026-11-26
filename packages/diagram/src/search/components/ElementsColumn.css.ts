import { css } from '@likec4/styles/css'
import { styled } from '@likec4/styles/jsx'
import { container, hstack } from '@likec4/styles/patterns'

export { focusable } from './_shared.css'

export const whenContainerIsNarrow = `@container likec4-tree (max-width: 450px)`

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
    px: '4',
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

export const ElementTitleAndId = styled('div', {
  base: hstack.raw({
    flexWrap: 'nowrap',
    gap: 'xs',
    [whenContainerIsNarrow]: {
      flexDirection: 'column-reverse',
      alignItems: 'flex-start',
      gap: '0.5',
    },
  }),
})

export const elementIcon = css({
  ['--likec4-icon-size']: '24px',
  [whenContainerIsNarrow]: {
    ['--likec4-icon-size']: '18px',
  },
})
