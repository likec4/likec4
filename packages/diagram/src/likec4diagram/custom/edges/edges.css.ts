import { css } from '@likec4/styles/css'

export const controlPointsContainer = css({
  overflow: 'visible',
  position: 'absolute',
  pointerEvents: 'none',
  top: '0',
  left: '0',
  mixBlendMode: {
    _dark: 'screen',
    _light: 'multiply',
  },
  zIndex: '[100]',
})

export const controlPoint = css({
  fill: `[var(--xy-edge-stroke)]`,
  stroke: `transparent`,
  fillOpacity: 0.5,
  strokeWidth: 10,
  r: 4,
  cursor: 'grab',
  pointerEvents: 'all',
  visibility: 'hidden',
  transitionDuration: '120ms',
  transitionProperty: 'visibility, fill, fill-opacity, r',
  transitionTimingFunction: 'inOut',
  transitionDelay: '20ms',
  [`:where([data-likec4-selected='true'], [data-likec4-hovered='true']) &`]: {
    visibility: 'visible',
    fillOpacity: 1,
    transitionTimingFunction: 'out',
    transitionDelay: '0ms',
  },
  [`:where([data-likec4-selected='true']) &`]: {
    r: 6,
  },
  [`:is([data-likec4-hovered='true']) &`]: {
    r: 8,
  },
  _hover: {
    fill: 'mantine.colors.primary.filledHover',
    r: 10,
    transitionDuration: '100ms',
  },
  _groupActive: {
    cursor: 'grabbing',
  },
})
