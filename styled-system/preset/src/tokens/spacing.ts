import { defineTokens } from '@pandacss/dev'
import { defaultTheme } from '../defaults/index.mts'

export const spacing = defineTokens.spacing({
  '0': {
    description: 'Non-scalable spacing value - 0px',
    value: '0px',
  },
  '0.5': {
    description: 'Non-scalable spacing value - (0.5 * 4px)',
    value: '2px',
  },
  '1': {
    description: 'Non-scalable spacing value - (1 * 4px)',
    value: '4px',
  },
  '1.5': {
    description: 'Non-scalable spacing value - (1.5 * 4px)',
    value: '6px',
  },
  '2': {
    description: 'Non-scalable spacing value - (2 * 4px)',
    value: '8px',
  },
  '2.5': {
    description: 'Non-scalable spacing value - (2.5 * 4px)',
    value: '10px',
  },
  '3': {
    description: 'Non-scalable spacing value - (3 * 4px)',
    value: '12px',
  },
  '3.5': {
    description: 'Non-scalable spacing value - (3.5 * 4px)',
    value: '14px',
  },
  '4': {
    description: 'Non-scalable spacing value - (4 * 4px)',
    value: '16px',
  },
  '4.5': {
    description: 'Non-scalable spacing value - (4.5 * 4px)',
    value: '18px',
  },
  '5': {
    description: 'Non-scalable spacing value - (5 * 4px)',
    value: '20px',
  },
  '6': {
    description: 'Non-scalable spacing value - (6 * 4px)',
    value: '24px',
  },
  '7': {
    description: 'Non-scalable spacing value - (7 * 4px)',
    value: '28px',
  },
  '8': {
    description: 'Non-scalable spacing value - (8 * 4px)',
    value: '32px',
  },
  '9': {
    description: 'Non-scalable spacing value - (9 * 4px)',
    value: '36px',
  },
  '10': {
    description: 'Non-scalable spacing value - (10 * 4px)',
    value: '40px',
  },
  '12': {
    description: 'Non-scalable spacing value - (12 * 4px)',
    value: '48px',
  },
  '16': {
    description: 'Non-scalable spacing value - (16 * 4px)',
    value: '64px',
  },
  xxs: {
    description: 'Scalable spacing value - (8px * var(--scale)) (8px)',
    value: 'calc(8px * var(--mantine-scale))', // 8px
  },
  xs: {
    description: 'Scalable spacing value - (10px * var(--scale)) (10px)',
    value: 'calc(10px * var(--mantine-scale))', // 10px
  },
  sm: {
    description: 'Scalable spacing value - (12px * var(--scale)) (12px)',
    value: 'calc(12px * var(--mantine-scale))', // 12px
  },
  md: {
    description: 'Scalable spacing value - (16px * var(--scale)) (16px)',
    value: 'calc(16px * var(--mantine-scale))', // 16px
  },
  lg: {
    description: 'Scalable spacing value - (20px * var(--scale)) (20px)',
    value: 'calc(20px * var(--mantine-scale))', // 20px
  },
  xl: {
    description: 'Scalable spacing value - (32px * var(--scale)) (32px)',
    value: 'calc(32px * var(--mantine-scale))', // 32px
  },
  likec4: Object.fromEntries(
    Object.entries(defaultTheme.spacing).map(([key, value]) => [
      key,
      {
        description: `LikeC4 Diagram Spacing: ${key}`,
        value: `${value}px`,
      },
    ]),
  ),
})
