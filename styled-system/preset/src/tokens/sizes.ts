import { defineTokens } from '@pandacss/dev'

export const sizes = defineTokens.sizes({
  '0': {
    value: '0',
  },
  auto: {
    value: 'auto',
  },
  max: {
    value: 'max-content',
  },
  min: {
    value: 'min-content',
  },
  fit: {
    value: 'fit-content',
  },
  cq: {
    fullw: {
      description: 'Full container width (cqw)',
      value: '100cqw',
    },
    fullh: {
      description: 'Full container height (cqh)',
      value: '100cqh',
    },
  },
  viewport: {
    fullw: {
      description: 'Full viewport width (vw)',
      value: '100vw',
    },
    fullh: {
      description: 'Full viewport height (vh)',
      value: '100vh',
    },
  },
  '100': {
    value: '100%',
  },
  full: {
    value: '100%',
  },
  icon: {
    DEFAULT: {
      description: 'Default icon size - 16px',
      value: '16px',
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
