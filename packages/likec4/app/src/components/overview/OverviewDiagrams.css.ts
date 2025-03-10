import { createGlobalThemeContract, globalStyle, style } from '@vanilla-extract/css'
import { mantine, whereLight } from '../../mantine'

const xyvars = createGlobalThemeContract({
  background: {
    color: 'background-color',
    pattern: {
      color: 'background-pattern-color',
      // dots: 'background-pattern-dots-color',
      // lines: 'background-pattern-lines-color',
      // cross: 'background-pattern-color'
    },
  },
  edge: {
    stroke: 'edge-stroke',
    strokeSelected: 'edge-stroke-selected',
    labelColor: 'edge-label-color',
    labelBgColor: 'edge-label-background-color',
    strokeWidth: 'edge-stroke-width',
  },
  node: {
    color: 'node-color',
    border: 'node-border',
    backgroundColor: 'node-background-color',
    groupBackgroundColor: 'node-group-background-color',
    boxshadowHover: 'node-boxshadow-hover',
    boxshadowSelected: 'node-boxshadow-selected',
    borderRadius: 'node-border-radius',
  },
}, (value) => `xy-${value}`)

export const root = style({})

globalStyle(`.react-flow.${root}`, {
  vars: {
    [xyvars.background.color]: mantine.colors.body,
    [xyvars.background.pattern.color]: mantine.colors.dark[5],
  },
})
globalStyle(`${whereLight} .react-flow.${root}`, {
  vars: {
    [xyvars.background.pattern.color]: mantine.colors.gray[4],
  },
})
globalStyle(`.react-flow.${root} .react-flow__attribution`, {
  display: 'none',
})
