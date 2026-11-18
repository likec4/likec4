import { defineSlotRecipe } from '@pandacss/dev'

export const edgeControlPoints = defineSlotRecipe({
  className: 'likec4-edge-control-points',
  slots: ['container', 'point'],
  base: {
    container: {
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
    },
    point: {
      fill: `var(--xy-edge-stroke)`,
      stroke: `transparent`,
      fillOpacity: '0.5',
      strokeWidth: '10',
      r: '4',
      cursor: 'grab',
      pointerEvents: 'all',
      visibility: 'hidden',
      transitionDuration: '{durations.fast}',
      transitionProperty: 'visibility, fill, fill-opacity, r',
      transitionTimingFunction: '{easings.inOut}',
      transitionDelay: '20ms',
      [`:where([data-likec4-selected='true'], [data-likec4-hovered='true']) &`]: {
        visibility: 'visible',
        fillOpacity: '1',
        transitionTimingFunction: '{easings.out}',
        transitionDelay: '0',
      },
      [`:where([data-likec4-selected='true']) &`]: {
        r: '[6]',
      },
      [`:is([data-likec4-hovered='true']) &`]: {
        r: '[8]',
      },
      _hover: {
        fill: '{colors.primary.body.hover}',
        r: '[10]',
        transitionDuration: '{durations.fastest}',
      },
      _groupActive: {
        cursor: 'grabbing',
      },
    },
  },
  staticCss: ['*'],
})
