import { globalStyle, style } from '@vanilla-extract/css'
import { ZIndexes } from '../../../base/const'
import { mantine, xyvars } from '../../../theme-vars'

const isSelected = '.react-flow__edge.selected'

export const controlPointsContainer = style({
  overflow: 'visible',
  position: 'absolute',
  pointerEvents: 'none',
  top: 0,
  left: 0,
  zIndex: ZIndexes.Edge,
  selectors: {
    [`&:is([data-edge-hovered='true'])`]: {
      zIndex: ZIndexes.Edge + 1,
    },
  },
})

export const controlPoint = style({
  fill: xyvars.edge.stroke,
  stroke: xyvars.edge.stroke,
  fillOpacity: 0.75,
  strokeWidth: 1,
  cursor: 'grab',
  pointerEvents: 'auto',
  visibility: 'hidden',
  ':hover': {
    stroke: mantine.colors.primaryColors.filledHover,
    strokeWidth: 9,
    transition: 'stroke 100ms ease-out, stroke-width 100ms ease-out',
  },
  selectors: {
    [`:where(${isSelected}, [data-edge-hovered='true']) &`]: {
      visibility: 'visible',
      transition: 'fill-opacity 150ms ease-out, stroke 150ms ease-out, stroke-width 150ms ease-out',
      transitionDelay: '50ms',
      fillOpacity: 1,
      strokeWidth: 5,
    },
  },
})

export const controlDragging = style({
  cursor: 'grabbing',
})

globalStyle(`${controlDragging} *`, {
  cursor: 'grabbing !important',
})
globalStyle(`${controlDragging} .react-flow__edge-interaction`, {
  cursor: 'grabbing !important',
})
