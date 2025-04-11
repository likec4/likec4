export const xyvars = {
  edge: {
    stroke: {
      var: '--xy-edge-stroke',
      ref: 'var(--xy-edge-stroke)',
    },
    strokeSelected: {
      var: '--xy-edge-stroke-selected',
      ref: 'var(--xy-edge-stroke-selected)',
    },
    labelColor: {
      var: '--xy-edge-label-color',
      ref: 'var(--xy-edge-label-color)',
    },
    labelBgColor: {
      var: '--xy-edge-label-background-color',
      ref: 'var(--xy-edge-label-background-color)',
    },
    strokeWidth: {
      var: '--xy-edge-stroke-width',
      ref: 'var(--xy-edge-stroke-width)',
    },
  },
  // edge: cssVar.scope('xy-edge', [
  //   'stroke',
  //   ['strokeSelected', 'stroke-selected'],
  //   ['labelColor', 'label-color'],
  //   ['labelBgColor', 'label-background-color'],
  //   ['strokeWidth', 'stroke-width'],
  // ]),
} as const
