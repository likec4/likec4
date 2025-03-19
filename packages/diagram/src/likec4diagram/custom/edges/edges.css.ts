import { css } from '@likec4/styles/css'
// import { globalStyle, style } from '@vanilla-extract/css'
// import { mantine, xyvars } from '../../../theme-vars'

const isSelected = '.react-flow__edge.selected'

export const controlPointsContainer = css({
  overflow: 'visible',
  position: 'absolute',
  pointerEvents: 'none',
  top: 0,
  left: 0,
})

export const controlPoint = css({
  fill: `likec4.relation.stroke`,
  stroke: `likec4.relation.stroke`,
  fillOpacity: 0.75,
  strokeWidth: 1,
  cursor: 'grab',
  pointerEvents: 'auto',
  visibility: 'hidden',
  _hover: {
    fillOpacity: 1,
    stroke: 'mantine.colors.primary.filledHover',
    strokeWidth: 10,
    transition: 'stroke 100ms ease-out, stroke-width 100ms ease-out',
  },
  [`:where(${isSelected}, [data-likec4-hovered='true']) &`]: {
    visibility: 'visible',
    transition: 'fill-opacity 150ms ease-out, stroke 150ms ease-out, stroke-width 150ms ease-out',
    transitionDelay: '50ms',
    fillOpacity: 1,
    strokeWidth: 5,
  },
})

export const controlDragging = css({
  cursor: 'grabbing',
  '& *': {
    cursor: 'grabbing !important',
  },
  '& .react-flow__edge-interaction': {
    cursor: 'grabbing !important',
  },
})
