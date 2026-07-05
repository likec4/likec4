import { defineTokens } from '@pandacss/dev'
import { spacing } from './spacing.ts'

export const sizes = defineTokens.sizes({
  '0': {
    value: '0',
  },
  auto: {
    value: 'auto',
  },
  'max-content': {
    value: 'max-content',
  },
  'min-content': {
    value: 'min-content',
  },
  'fit-content': {
    value: 'fit-content',
  },
  'stretch': {
    value: 'stretch',
  },
  '100cqw': {
    description: 'Full container width (cqw)',
    value: '100cqw',
  },
  '100cqh': {
    description: 'Full container height (cqh)',
    value: '100cqh',
  },
  '100vw': {
    description: 'Full viewport width (vw)',
    value: '100vw',
  },
  '100vh': {
    description: 'Full viewport height (vh)',
    value: '100vh',
  },
  '100%': {
    value: '100%',
  },
  '50%': {
    value: '50%',
  },
  spacing,
  full: {
    value: '100%',
  },
  ['action-icon']: {
    DEFAULT: {
      description: 'Default action icon size - 28px',
      value: '28px',
    },
  },
  icon: {
    DEFAULT: {
      description: 'Default icon size - 16px',
      value: '16px',
    },
    xxs: {
      description: 'Extra extra small icon size - 10px',
      value: '10px',
    },
    xs: {
      description: 'Extra small icon size - 12px',
      value: '12px',
    },
    sm: {
      description: 'Small icon size - 14px',
      value: '14px',
    },
    md: {
      description: 'Medium icon size - 16px',
      value: '16px',
    },
    lg: {
      description: 'Large icon size - 18px',
      value: '18px',
    },
    xl: {
      description: 'Extra large icon size - 22px',
      value: '22px',
    },
  },
})
