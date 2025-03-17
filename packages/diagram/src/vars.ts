export const xyvars = {
  background: {
    color: '--xy-background-color',
    pattern: {
      color: '--xy-background-pattern-color',
      // dots: 'background-pattern-dots-color',
      // lines: 'background-pattern-lines-color',
      // cross: 'background-pattern-cross-color'
    },
  },
  edge: {
    stroke: '--xy-edge-stroke',
    strokeSelected: '--xy-edge-stroke-selected',
    labelColor: '--xy-edge-label-color',
    labelBgColor: '--xy-edge-label-background-color',
    strokeWidth: '--xy-edge-stroke-width',
  },
  node: {
    color: '--xy-node-color',
    border: '--xy-node-border',
    backgroundColor: '--xy-node-background-color',
    groupBackgroundColor: '--xy-node-group-background-color',
    boxshadowHover: '--xy-node-boxshadow-hover',
    boxshadowSelected: '--xy-node-boxshadow-selected',
    borderRadius: '--xy-node-border-radius',
  },
} as const
