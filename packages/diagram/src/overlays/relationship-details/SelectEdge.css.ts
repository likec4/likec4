import { css, cx } from '@likec4/styles/css'

const edgeEnpoint = css.raw({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 2px 0 2px',
  '& .mantine-Text-root': {
    fontSize: 'xs',
    fontWeight: 500,
    lineHeight: '',
  },
})

export const edgeSource = css({
  paddingLeft: 4,
  gridColumn: 1,
}, edgeEnpoint)

export const edgeArrow = css({
  gridColumn: 2,
}, edgeEnpoint)

export const edgeTarget = css({
  gridColumn: 3,
  paddingRight: 4,
}, edgeEnpoint)

const edgeLabelclass = 'likec4-edge-label'
export const edgeLabel = cx(
  edgeLabelclass,
  css({
    display: 'grid',
    gridColumnStart: 1,
    gridColumnEnd: 4,
    borderBottom: `1px solid`,
    borderBottomColor: 'mantine.colors.defaultBorder',
    marginBottom: '0px',
    padding: '0 4px 5px 4px',
    width: '100%',
    '& .mantine-Text-root': {
      fontSize: 'sm',
      fontWeight: 400,
      lineHeight: 1,
      color: 'mantine.colors.dimmed',
    },
    // gridArea: '2 / 1 / 3 / 3',
    // selectors: {
    //   '&:last-child': {
    //     borderBottom: 'none',
    //     marginBottom: 0
    //   }
    // }
  }),
)

export const edgeRow = css({
  display: 'contents',
  [`&:last-child .${edgeLabelclass}`]: {
    borderBottom: 'none',
    marginBottom: 0,
  },
  '& > *': {
    transition: 'all 0.15s ease-in',
  },
  '&:is(:hover, [data-selected=true]) > *': {
    transition: 'all 0.15s ease-out',
    cursor: 'pointer',
    backgroundColor: 'mantine.colors.defaultHover',
  },
})

export const edgeGrid = css({
  display: 'grid',
  gridTemplateColumns: '1fr 30px 1fr',
  gridAutoRows: 'min-content max-content',
  gap: 0,
  alignItems: 'stretch',
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

export const edgeDataGrid = css({
  display: 'grid',
  gridTemplateColumns: 'min-content 1fr',
  gridAutoRows: 'min-content max-content',
  gap: '10px 12px',
  alignItems: 'baseline',
  justifyItems: 'start',
})

export const scrollArea = css({
  maxHeight: [
    '70vh',
    'calc(100cqh - 70px)',
  ],
})
