import { defineRecipe } from '@pandacss/dev'

export const navigationPanelActionIcon = defineRecipe({
  className: 'likec4-navigation-panel-icon',
  jsx: ['PanelActionIcon'],
  description: 'ActionIcon for navigation panel',
  base: {
    color: {
      base: 'likec4.panel.action-icon.text',
      _disabled: 'likec4.panel.action-icon.text.disabled',
      _notDisabled: {
        _hover: 'likec4.panel.action-icon.text.hover',
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
          base: '[transparent]',
          _notDisabled: {
            _hover: 'likec4.panel.action-icon.bg.hover',
          },
        },
      },
      'filled': {
        backgroundColor: {
          base: 'likec4.panel.action-icon.bg',
          _notDisabled: {
            _hover: 'likec4.panel.action-icon.bg.hover',
          },
        },
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
  staticCss: [{
    variant: ['*'],
    conditions: ['*'],
  }],
})
