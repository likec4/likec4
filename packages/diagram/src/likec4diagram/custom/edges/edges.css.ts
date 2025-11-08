import { css } from '@likec4/styles/css'

export const controlPointsContainer = css({
  overflow: 'visible',
  position: 'absolute',
  pointerEvents: 'none',
  top: '0',
  left: '0',
  mixBlendMode: 'normal',
})

export const controlPoint = css({
  fill: `var(--likec4-palette-relation-stroke)`,
  stroke: `var(--likec4-palette-relation-stroke)`,
  fillOpacity: 0.75,
  strokeWidth: 1,
  cursor: 'grab',
  pointerEvents: 'auto',
  visibility: 'hidden',
  _hover: {
    fillOpacity: 1,
    stroke: 'mantine.colors.primary.filledHover',
    strokeWidth: 18,
    transition: 'stroke 100ms ease-out, stroke-width 100ms ease-out',
  },
  [`:where([data-likec4-selected='true'], [data-likec4-hovered='true']) &`]: {
    visibility: 'visible',
    transition: 'fill-opacity 150ms ease-out, stroke 150ms ease-out, stroke-width 150ms ease-out',
    transitionDelay: '50ms',
    fillOpacity: 1,
    strokeWidth: 12,
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
