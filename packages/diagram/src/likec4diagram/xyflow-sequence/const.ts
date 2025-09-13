// minimum space between actors
export const ACTOR_GAP = 40

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

// offset for continuing steps
// A -> B,
//      C -> D (sequential)
// A -> B -> C (continuous)
export const CONTINUOUS_OFFSET = 22

export const SeqZIndex = {
  compound: 0,
  parallel: 1,
  actor: 10,
  step: 20,
}
