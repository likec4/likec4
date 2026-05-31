import type { ThemeColor } from '@likec4/core/types'

// minimum space between actors
export const ACTOR_GAP = 60

// minimum space between columns
export const COLUMN_GAP = 32

// minimum height of a step row
export const MIN_ROW_HEIGHT = 80

// height of ports, edges connected to center of ports
export const PORT_HEIGHT = 32

// margin from step label to step box
export const STEP_LABEL_MARGIN = 50

// offset from actor box
export const FIRST_STEP_OFFSET = 30

// Actor card dimensions in the sequence view.
// Overrides graphviz-computed node sizes to keep cards compact and
// leave more horizontal room for step arrows and labels.
export const SEQ_ACTOR_WIDTH = 56
export const SEQ_ACTOR_HEIGHT = 34

// offset for continuing steps
// A -> B,
//      C -> D (sequential)
// A -> B -> C (continuous)
export const CONTINUOUS_OFFSET = 22

// Vertical label offset applied by the renderer for non-self-loop steps.
// Must match LABEL_OFFSET in SequenceStepEdge.tsx so layout gap math is accurate.
export const LABEL_OFFSET = 16

export const SeqZIndex = {
  compound: 0,
  parallel: 1,
  actor: 10,
  step: 20,
}

export const SeqParallelAreaColor = {
  default: 'gray',
  active: 'amber',
} satisfies Record<string, ThemeColor>
