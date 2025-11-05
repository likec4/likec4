import { defineRecipe } from '@pandacss/dev'

export const navigationPanelActionIcon = defineRecipe({
  className: 'likec4-navigation-panel-icon',
  jsx: ['PanelActionIcon'],
  description: 'ActionIcon for navigation panel',
  base: {
    color: {
      base: 'likec4.panel.action',
      _disabled: 'likec4.panel.action.disabled',
      _notDisabled: {
        _hover: 'likec4.panel.action.hover',
      },
    },
    _disabled: {
      opacity: 0.5,
    },
  },
  variants: {
    variant: {
      'default': {
        backgroundColor: {
          base: 'transparent',
          _notDisabled: {
            _hover: 'likec4.panel.action.bg.hover',
          },
        },
      },
      'filled': {
        backgroundColor: {
          base: 'likec4.panel.action.bg',
          _notDisabled: {
            _hover: 'likec4.panel.action.bg.hover',
          },
        },
      },
    },
    type: {
      'default': {},
      'warning': {
        color: {
          base: 'likec4.panel.action.warning',
          _hover: 'likec4.panel.action.warning.hover',
        },
      },
    },
  },
  compoundVariants: [{
    type: 'warning',
    variant: 'filled',
    css: {
      backgroundColor: {
        base: 'likec4.panel.action.warning.bg',
        _hover: 'likec4.panel.action.warning.bg.hover',
      },
    },
  }],
  defaultVariants: {
    variant: 'default',
    type: 'default',
  },
  staticCss: [{
    variant: ['*'],
    conditions: ['*'],
  }],
})
