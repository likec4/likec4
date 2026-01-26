import type { ViewPadding } from '../LikeC4Diagram.props'

export const ZIndexes = {
  Compound: 1,
  // XYFlow increments zIndexes of compounds
  Edge: 20,
  Element: 20,
  Max: 30,
} as const

export const MinZoom = 0.05
export const MaxZoom = 3

export const FitViewPaddings = {
  default: '16px',
  withControls: {
    top: '58px',
    left: '16px',
    right: '16px',
    bottom: '16px',
  },
} satisfies Record<string, ViewPadding>

export const MAX_COMPOUND_DEPTH = 5
