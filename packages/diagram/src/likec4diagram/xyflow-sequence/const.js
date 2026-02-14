"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeqParallelAreaColor = exports.SeqZIndex = exports.CONTINUOUS_OFFSET = exports.FIRST_STEP_OFFSET = exports.STEP_LABEL_MARGIN = exports.PORT_HEIGHT = exports.MIN_ROW_HEIGHT = exports.COLUMN_GAP = exports.ACTOR_GAP = void 0;
// minimum space between actors
exports.ACTOR_GAP = 60;
// minimum space between columns
exports.COLUMN_GAP = 32;
// minimum height of a step row
exports.MIN_ROW_HEIGHT = 80;
// height of ports, edges connected to center of ports
exports.PORT_HEIGHT = 32;
// margin from step label to step box
exports.STEP_LABEL_MARGIN = 50;
// offset from actor box
exports.FIRST_STEP_OFFSET = 30;
// offset for continuing steps
// A -> B,
//      C -> D (sequential)
// A -> B -> C (continuous)
exports.CONTINUOUS_OFFSET = 22;
exports.SeqZIndex = {
    compound: 0,
    parallel: 1,
    actor: 10,
    step: 20,
};
exports.SeqParallelAreaColor = {
    default: 'gray',
    active: 'amber',
};
