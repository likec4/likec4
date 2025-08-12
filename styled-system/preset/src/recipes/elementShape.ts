import { defineParts, defineRecipe } from '@pandacss/dev'

const parts = defineParts({
  root: { selector: '&' },
  outline: { selector: '& .likec4-shape-outline' },
  multipleHtml: { selector: '& .likec4-shape-multiple' },
  multipleSvg: { selector: '&:is([data-likec4-shape-multiple="true"])' },
})

export const elementShapeRecipe = defineRecipe({
  description: 'Recipe for Diagram node shape',
  className: 'likec4-element-shape',
  base: parts({
    root: {
      top: '0',
      left: '0',
      position: 'absolute',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      overflow: 'visible',
      ['--likec4-palette-outline']: {
        _light: 'color-mix(in srgb, var(--likec4-palette-stroke) 60%, var(--likec4-palette-hiContrast))',
        _dark: 'color-mix(in srgb, var(--likec4-palette-stroke) 30%, var(--likec4-palette-loContrast))',
      },
    },
    outline: {
      visibility: {
        base: 'hidden',
        _smallZoom: 'hidden',
        _whenSelected: 'visible',
        _whenFocused: 'visible',
        _groupFocusVisible: 'visible',
      },
      animationPlayState: {
        base: 'paused',
        _whenSelected: 'running',
        _whenFocused: 'running',
        _groupFocusVisible: 'running',
        _whenPanning: 'paused',
      },
      pointerEvents: 'none',
    },
  }),
  variants: {
    shapetype: {
      html: parts({
        root: {
          backgroundColor: 'var(--likec4-palette-fill)',
          borderRadius: '[6px]',
          boxShadow: {
            base: [
              '0 2px 1px 0 rgb(0 0 0 / 21%)',
              '0 1px 1px 0 color-mix(in srgb, var(--likec4-palette-stroke) 40%, transparent)',
              '0 5px 3px 0 rgb(0 0 0 / 10%)',
            ].join(','),
            _whenHovered: [
              '0 2px 1px 0 rgb(0 0 0 / 25%)',
              '0 8px 3px 0 rgb(0 0 0 / 10%)',
              '0 10px 10px 0 rgb(0 0 0 / 8%)',
            ].join(','),
            _whenSelected: 'none',
            _smallZoom: 'none',
            _whenPanning: 'none',
          },
          transition: {
            base: 'background-color 120ms linear, box-shadow 130ms {easings.inOut}',
            _reduceGraphicsOnPan: 'none',
          },
          transitionDelay: '0ms',
          ['--likec4-outline-size']: `4px`,
        },
        multipleHtml: {
          position: 'absolute',
          content: '" "',
          top: '[14px]',
          left: '[14px]',
          width: '[calc(100% - 6px)]',
          height: '[calc(100% - 6px)]',
          backgroundColor: 'var(--likec4-palette-fill)',
          borderRadius: '[6px]',
          zIndex: -1,
          filter: 'brightness(0.65)',
          visibility: {
            base: 'visible',
            _smallZoom: 'hidden',
            _whenSelected: 'hidden',
            _whenFocused: 'hidden',
            _reduceGraphicsOnPan: 'hidden',
          },
        },
        outline: {
          position: 'absolute',
          content: '" "',
          top: `[calc(-1 * var(--likec4-outline-size))]`,
          left: `[calc(-1 * var(--likec4-outline-size))]`,
          width: `[calc(100% + 2 * var(--likec4-outline-size))]`,
          height: `[calc(100% + 2 * var(--likec4-outline-size))]`,
          borderStyle: 'solid',
          borderWidth: 'var(--likec4-outline-size)',
          borderRadius: '[10px]',
          borderColor: 'var(--likec4-palette-outline)',
          animationStyle: 'indicatorOpacity',
        },
      }),
      svg: parts({
        root: {
          fill: 'var(--likec4-palette-fill)',
          stroke: 'var(--likec4-palette-stroke)',
          transition: `fill 120ms linear, filter 130ms {easings.inOut}`,
          transitionDelay: '0ms',
          filter: {
            base: [
              'drop-shadow(0 2px 1px rgba(0, 0, 0, 0.21))',
              'drop-shadow(0 1px 1px color-mix(in srgb, var(--likec4-palette-stroke) 40%, transparent))',
              'drop-shadow(0 5px 3px rgba(0, 0, 0, 0.1))',
            ].join('\n'),
            _whenHovered: [
              'drop-shadow(0 2px 1px rgba(0, 0, 0, 0.25))',
              'drop-shadow(0 8px 3px rgba(0, 0, 0, 0.1))',
              'drop-shadow(0 10px 10px rgba(0, 0, 0, 0.05))',
            ].join('\n'),
            _whenSelected: 'none',
            _smallZoom: 'none',
            _whenPanning: 'none',
          },
          '& [data-likec4-fill="fill"]': {
            fill: 'var(--likec4-palette-fill)',
          },
          '& [data-likec4-fill="stroke"]': {
            fill: 'var(--likec4-palette-stroke)',
          },
          '& [data-likec4-fill="mix-stroke"]': {
            fill: '[color-mix(in srgb, var(--likec4-palette-stroke) 90%, var(--likec4-palette-fill))]',
          },
        },
        multipleSvg: {
          transformOrigin: {
            base: '50% 50%',
            _shapeQueue: '75% 25%',
            _shapeCylinder: '50% 100%',
            _shapeStorage: '50% 100%',
          },
          transform: 'translate(14px, 14px) perspective(300px) translateZ(-8px)',
          filter: 'brightness(0.65)',
          stroke: '[none]',
          display: {
            _smallZoom: 'none',
            _reduceGraphicsOnPan: 'none',
            _whenSelected: 'none',
            _whenFocused: 'none',
          },
          '& [data-likec4-fill="mix-stroke"]': {
            fill: 'var(--likec4-palette-fill)',
          },
        },
        outline: {
          stroke: 'var(--likec4-palette-outline)',
          fill: '[none]',
          strokeWidth: 8,
          strokeOpacity: 0.8,
          animationStyle: 'indicator',
        },
      }),
    },
  },
  staticCss: [{
    shapetype: ['*'],
    conditions: ['*'],
  }],
})
