import { globalStyle, style } from '@vanilla-extract/css'
import { mantine } from '../../theme-vars'

const edgeEnpoint = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 2px 0 2px'
})

globalStyle(`${edgeEnpoint} .mantine-Text-root`, {
  fontSize: mantine.fontSizes.xs,
  fontWeight: 500,
  lineHeight: 1
})

export const edgeSource = style([{
  paddingLeft: 4,
  gridColumn: 1
}, edgeEnpoint])
export const edgeArrow = style([{
  gridColumn: 2
}, edgeEnpoint])
export const edgeTarget = style([{
  gridColumn: 3,
  paddingRight: 4
}, edgeEnpoint])

export const edgeLabel = style({
  display: 'grid',
  gridColumnStart: 1,
  gridColumnEnd: 4,
  borderBottom: `1px solid ${mantine.colors.defaultBorder}`,
  marginBottom: '0px',
  padding: '0 4px 5px 4px'
  // gridArea: '2 / 1 / 3 / 3',
  // selectors: {
  //   '&:last-child': {
  //     borderBottom: 'none',
  //     marginBottom: 0
  //   }
  // }
})

globalStyle(`${edgeLabel} .mantine-Text-root`, {
  fontSize: mantine.fontSizes.sm,
  fontWeight: 400,
  color: mantine.colors.dimmed
})

export const edgeRow = style({
  display: 'contents'
})

globalStyle(`${edgeRow}:last-child ${edgeLabel}`, {
  borderBottom: 'none',
  marginBottom: 0
})

globalStyle(`${edgeRow} > *`, {
  transition: 'all 0.15s ease-in'
})

globalStyle(`${edgeRow}:is(:hover, [data-selected=true]) > *`, {
  transition: 'all 0.15s ease-out',
  cursor: 'pointer',
  backgroundColor: mantine.colors.defaultHover
})

export const edgeGrid = style({
  display: 'grid',
  gridTemplateColumns: '1fr 30px 1fr',
  gridAutoRows: 'min-content max-content',
  gap: 0,
  alignItems: 'stretch'
  // gridTemplateColumns: 'auto',
  // gridTemplateRows: `
  //   [row1-start] "source target" auto [row1-end]
  //   [row2-start] "label label" 50px [row2-end]
  // `,
  // gridTemplateAreas: `
  //   "source target"
  //   "label label"
  // `

  // gridTemplateRows: `
  //   repeat(auto-fill, [row1-start] "source target" 20px [row1-end]
  //                     [row2-start] "label" . 20px [row2-end])
  // `,
  // gridAutoFlow: 'row',
})
