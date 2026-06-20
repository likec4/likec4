import type { ThemeColor } from '@likec4/core/types'

// minimum space between actors
export const ACTOR_GAP = 80

// minimum space between columns
export const COLUMN_GAP = 50

// minimum height of a step row
export const MIN_ROW_HEIGHT = 100

// height of ports, edges connected to center of ports
export const PORT_HEIGHT = 24

// margin from step label to step box
export const STEP_LABEL_MARGIN = 50

// offset from actor box
export const FIRST_STEP_OFFSET = 20

// offset for continuing steps
// A -> B,
//      C -> D (sequential)
// A -> B -> C (continuous)
export const CONTINUOUS_OFFSET = 22

export const SeqZIndex = {
  compound: 1,
  subflows: 10,
  actor: 50,
  step: 100,
}

export const SeqParallelAreaColor = {
  default: 'gray',
  active: 'amber',
} satisfies Record<string, ThemeColor>
