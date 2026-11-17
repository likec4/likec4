import { css } from '@likec4/styles/css'
import { styled } from '@likec4/styles/jsx'

// Values follow the "LikeC4 Workspace Projects" design system (bundle.css)

const padX = { base: '4', sm: '8', xl: '12' } as const

export const page = css({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'surface.canvas',
  color: 'text',
  fontFamily: 'body',
  fontSize: 'md',
  lineHeight: '[1.45]',
})

export const pageScroll = css({
  flex: '1',
  minHeight: '0',
  overflowY: 'auto',
})

export const header = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '6',
  paddingTop: '6',
  paddingBottom: '6',
  paddingX: padX,
})

export const headerTitles = css({
  display: 'flex',
  alignItems: 'center',
  gap: '3',
  minWidth: '0',
})

export const logo = css({
  flexShrink: '0',
  width: '[28px]',
  height: '[28px]',
})

export const title = css({
  margin: '0',
  fontFamily: 'display',
  fontSize: { base: '[22px]', sm: '[26px]' },
  lineHeight: '[1.1]',
  fontWeight: 'bold',
  letterSpacing: '[-0.02em]',
  color: 'text.display',
})

export const summary = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: { base: '5', sm: '8' },
})

export const fieldLabel = css({
  fontSize: 'micro',
  lineHeight: '[1.05]',
  fontWeight: 'semibold',
  letterSpacing: '[0.08em]',
  textTransform: 'uppercase',
  color: 'text.dimmed',
})

export const metricValue = css({
  fontFamily: 'body',
  fontSize: 'xl',
  lineHeight: '[1.1]',
  fontWeight: 'medium',
  letterSpacing: '[-0.02em]',
  color: 'text.bright',
  fontVariantNumeric: 'tabular-nums',
  '&[data-size="lg"]': {
    fontSize: '[20px]',
  },
})

export const toolbar = css({
  flexShrink: '0',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '3',
  paddingY: '3.5',
  paddingX: padX,
  borderTopWidth: '1',
  borderTopStyle: 'solid',
  borderBottomWidth: '1',
  borderBottomStyle: 'solid',
  borderColor: 'border.subtle',
  backgroundColor: 'surface.sunken',
})

const field = {
  height: '[32px]',
  borderRadius: 'sm',
  borderWidth: '1',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
  backgroundColor: 'surface.field',
  color: 'text',
  fontFamily: 'body',
  fontSize: 'sm',
  _hover: {
    borderColor: 'border.default',
  },
  _focus: {
    outline: 'none',
    borderColor: 'primary.border',
    boxShadow: '[0 0 0 1px var(--colors-primary-border)]',
  },
} as const

export const sortButton = css({
  ...field,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  paddingLeft: '3',
  paddingRight: '2',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  '& > svg': {
    color: 'text.dimmed',
  },
  '&[aria-expanded="true"]': {
    borderColor: 'border.default',
  },
})

export const toolbarSpacer = css({
  flex: '1',
})

/**
 * Icon + text inside a SegmentedControl item: a block-level flex box, so it is centred
 * in the item instead of sitting on the text baseline
 */
export const modeLabel = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1.5',
  lineHeight: '1',
  '& > svg': {
    display: 'block',
    flexShrink: '0',
  },
})

export const CardGrid = styled('div', {
  base: {
    display: 'grid',
    gridTemplateColumns: { base: '1fr', sm: 'repeat(auto-fill, minmax(340px, 1fr))' },
    alignItems: 'start',
    gap: { base: '5', sm: '8' },
    paddingTop: '8',
    paddingBottom: '12',
    paddingX: padX,
  },
})
export const card = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  minWidth: '0',
  backgroundColor: 'surface.default',
  borderWidth: '1',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
  borderRadius: 'md',
  boxShadow: 'xs',
  transition: 'fast',
  transitionProperty: '[border-color, box-shadow]',
  _hover: {
    borderColor: 'border.strong',
    boxShadow: 'sm',
  },
})

export const cardHead = css({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '3.5',
  paddingTop: '5',
  paddingX: '5',
})

/**
 * Makes the head the only clickable area of the card: the stretched link covers the head, not the whole card,
 * so the rest of the card keeps its own hovers and buttons
 */
export const cardHeadLinked = css({
  position: 'relative',
  borderTopRadius: 'md',
  '& a::after': {
    borderRadius: '[inherit]',
  },
})

export const cardTitles = css({
  flex: '1',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '1',
})

export const cardTitle = css({
  margin: '0',
  fontFamily: 'display',
  fontSize: 'xl',
  fontWeight: 'semibold',
  lineHeight: '[1.35]',
  color: 'text.bright',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

/**
 * The title link stretches over the whole card, so the card is one click target
 */
export const cardLink = css({
  color: 'inherit',
  textDecoration: 'none',
  outline: 'none',
  _after: {
    content: '""',
    position: 'absolute',
    inset: '0',
    borderRadius: 'md',
  },
  _focusVisible: {
    _after: {
      outline: '[2px solid var(--colors-primary-border)]',
      outlineOffset: '[2px]',
    },
  },
})

export const cardSub = css({
  fontFamily: 'body',
  fontSize: 'xs',
  lineHeight: '[1.35]',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  color: 'text.dimmed',
})

export const cardOpen = css({
  flexShrink: '0',
  opacity: '0',
  transition: 'fast',
  color: 'text.dimmed',
  _groupHover: {
    opacity: '1',
  },
  _groupFocusWithin: {
    opacity: '1',
  },
})

/**
 * Details hang off the title's left edge: card padding (20) + monogram (36) + head gap (14).
 * Grows to fill the card, so footers line up across a row of equal-height cards
 */
export const cardBody = css({
  // above the stretched link of the head
  position: 'relative',
  zIndex: '[1]',
  flex: '1',
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  paddingTop: '3',
  paddingRight: '5',
  paddingBottom: '[18px]',
  paddingLeft: '[70px]',
})

export const detailButton = css({
  appearance: 'none',
  background: 'none',
  border: 'none',
  padding: '0',
  textAlign: 'left',
  cursor: 'pointer',
  width: 'fit-content',
  maxWidth: '100%',
  '&:hover > span': {
    color: 'text.link',
    textDecoration: 'underline',
  },
})

export const detail = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  minWidth: '0',
  fontSize: 'sm',
  color: 'text',
  cursor: 'default',
  '& > svg': {
    flexShrink: '0',
    color: 'text.dimmed',
  },
  '& > span': {
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '&[data-empty] > span': {
    color: 'text.dimmed',
  },
})

export const metricsCard = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, auto)',
  gap: '6',
  paddingY: '3',
  paddingX: '4',
})

export const metric = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  minWidth: '0',
})

export const cardFoot = css({
  // above the stretched link, so tooltips and the expand button stay usable
  position: 'relative',
  zIndex: '[1]',
  display: 'flex',
  alignItems: 'center',
  gap: '5',
  minHeight: '[52px]',
  paddingY: '2',
  paddingLeft: '5',
  paddingRight: '3',
  backgroundColor: 'surface.sunken',
  borderTopWidth: '1',
  borderTopStyle: 'solid',
  borderColor: 'border.subtle',
  // inner radius of the card border
  borderBottomRadius: '[calc(var(--radii-md) - 1px)]',
  // the expanded dependencies panel follows
  '&:not(:last-child)': {
    borderBottomRadius: '0',
  },
})

export const depSummary = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  minWidth: '0',
})

export const stack = css({
  display: 'inline-flex',
  alignItems: 'center',
  '& > *:not(:first-child)': {
    marginLeft: '[-4px]',
  },
})

export const miniMore = css({
  display: 'inline-grid',
  placeItems: 'center',
  width: '[22px]',
  height: '[22px]',
  borderRadius: 'sm',
  fontFamily: 'body',
  fontSize: 'micro',
  fontWeight: 'semibold',
  backgroundColor: 'surface.sunken',
  boxShadow: '[0 0 0 2px var(--colors-surface-default), inset 0 0 0 1px var(--colors-border-subtle)]',
  cursor: '[help]',
  color: 'text.dimmed',
})

export const depEmpty = css({
  fontFamily: 'body',
  fontSize: 'xs',
  color: 'text.dimmed',
})

export const expand = css({
  display: 'inline-grid',
  placeItems: 'center',
  width: '[28px]',
  height: '[28px]',
  marginLeft: 'auto',
  border: 'none',
  borderRadius: 'sm',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  color: 'text.dimmed',
  _hover: {
    backgroundColor: 'surface.hover',
    color: 'text',
  },
  '& svg': {
    transition: 'fast',
  },
  '&[aria-expanded="true"] svg': {
    transform: 'rotate(180deg)',
  },
})

export const expandPanel = css({
  position: 'relative',
  zIndex: '[1]',
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  paddingTop: '4',
  paddingX: '5',
  paddingBottom: '5',
  backgroundColor: 'surface.sunken',
  borderTopWidth: '1',
  borderTopStyle: 'solid',
  borderColor: 'border.subtle',
  borderBottomRadius: 'md',
})

export const depsGroup = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5',
  '& > span:first-child': {
    marginBottom: '1',
  },
})

export const depsItem = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  height: '[30px]',
  paddingX: '1.5',
  borderRadius: 'sm',
  fontSize: 'sm',
  color: 'text',
  textDecoration: 'none',
  _hover: {
    backgroundColor: 'surface.sunken.hover',
  },
  '& > span:nth-child(2)': {
    flex: '1',
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '& > span:last-child': {
    fontFamily: 'body',
    fontSize: 'xs',
    fontVariantNumeric: 'tabular-nums',
    color: 'text.dimmed',
  },
})

export const tableWrap = css({
  overflowX: 'auto',
  paddingTop: '8',
  paddingBottom: '12',
  paddingX: padX,
})

export const table = css({
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: '0',
  borderWidth: '1',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
  borderRadius: 'md',
  overflow: 'hidden',
  fontSize: 'sm',
  '& th': {
    textAlign: 'left',
    fontFamily: 'body',
    fontSize: 'xxs',
    fontWeight: 'medium',
    letterSpacing: '[0.06em]',
    textTransform: 'uppercase',
    paddingX: '4',
    paddingY: '3',
    backgroundColor: 'surface.sunken',
    borderBottomWidth: '1',
    borderBottomStyle: 'solid',
    borderColor: 'border.subtle',
    whiteSpace: 'nowrap',
    color: 'text.dimmed',
  },
  '& td': {
    paddingX: '4',
    paddingY: '3',
    borderBottomWidth: '1',
    borderBottomStyle: 'solid',
    borderColor: 'border.subtle',
    verticalAlign: 'middle',
    backgroundColor: 'surface.default',
  },
  '& tbody tr:last-child td': {
    borderBottom: 'none',
  },
  '& tbody tr': {
    cursor: 'pointer',
  },
  '& tbody tr:hover td': {
    backgroundColor: 'surface.hover',
  },
  '& [data-num]': {
    textAlign: 'right',
    fontFamily: 'body',
    fontVariantNumeric: 'tabular-nums',
  },
  '& [data-dimmed]': {
    color: 'text.dimmed',
  },
})

export const nameCell = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  fontWeight: 'medium',
  color: 'text.bright',
  whiteSpace: 'nowrap',
  textDecoration: 'none',
  maxWidth: '[320px]',
  '& > span:last-child': {
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
})

export const mapArea = css({
  flex: '1',
  minHeight: '0',
  position: 'relative',
  marginTop: '8',
  marginBottom: '10',
  marginX: padX,
  borderWidth: '1',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
  borderRadius: 'md',
  overflow: 'hidden',
})
