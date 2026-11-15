import { css } from '@likec4/styles/css'

// Values follow the "LikeC4 Workspace Projects" design system (bundle.css)

const textSecondary = {
  color: '[var(--mantine-color-gray-7)]',
  _dark: {
    color: '[var(--mantine-color-dark-1)]',
  },
} as const

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
  alignItems: 'flex-end',
  justifyContent: 'space-between',
  gap: '8',
  paddingTop: { base: '8', sm: '12' },
  paddingBottom: '8',
  paddingX: padX,
})

export const headerTitles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  minWidth: '0',
})

export const eyebrow = css({
  fontFamily: 'mono',
  fontSize: 'xxs',
  lineHeight: '[1.2]',
  fontWeight: 'medium',
  letterSpacing: '[0.12em]',
  textTransform: 'uppercase',
  ...textSecondary,
})

export const title = css({
  margin: '0',
  fontFamily: 'display',
  fontSize: { base: '[26px]', sm: '[34px]' },
  lineHeight: '[1.1]',
  fontWeight: 'bold',
  letterSpacing: '[-0.02em]',
  color: 'text.display',
})

export const summary = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: { base: '6', sm: '10' },
})

export const summaryItem = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
})

export const fieldLabel = css({
  fontSize: 'micro',
  lineHeight: '[1.05]',
  fontWeight: 'semibold',
  letterSpacing: '[0.08em]',
  textTransform: 'uppercase',
  ...textSecondary,
})

export const metricValue = css({
  fontFamily: 'mono',
  fontSize: 'xl',
  lineHeight: '[1.1]',
  fontWeight: 'medium',
  letterSpacing: '[-0.02em]',
  color: 'text.bright',
  fontVariantNumeric: 'tabular-nums',
  '&[data-size="lg"]': {
    fontSize: '[26px]',
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

export const seg = css({
  display: 'inline-flex',
  padding: '0.5',
  gap: '0.5',
  borderRadius: 'sm',
  backgroundColor: 'surface.sunken',
  borderWidth: '1',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
  '& button': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '1.5',
    height: '[26px]',
    paddingX: '2.5',
    border: 'none',
    borderRadius: '[3px]',
    backgroundColor: 'transparent',
    fontFamily: 'body',
    fontSize: 'xs',
    fontWeight: 'medium',
    cursor: 'pointer',
    ...textSecondary,
    _hover: {
      color: 'text',
    },
    '&[aria-pressed="true"]': {
      backgroundColor: 'surface.default',
      color: 'text.bright',
      boxShadow: 'xs',
    },
    _focusVisible: {
      outline: '[2px solid var(--colors-primary-border)]',
      outlineOffset: '[2px]',
    },
  },
})

export const grid = css({
  display: 'grid',
  gridTemplateColumns: { base: '1fr', sm: 'repeat(auto-fill, minmax(340px, 1fr))' },
  alignItems: 'start',
  gap: { base: '5', sm: '8' },
  paddingTop: '8',
  paddingBottom: '12',
  paddingX: padX,
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
  paddingBottom: '4',
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
  fontFamily: 'mono',
  fontSize: 'xs',
  lineHeight: '[1.35]',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  ...textSecondary,
})

export const cardOpen = css({
  flexShrink: '0',
  opacity: '0',
  transition: 'fast',
  ...textSecondary,
  _groupHover: {
    opacity: '1',
  },
  _groupFocusWithin: {
    opacity: '1',
  },
})

export const cardBody = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '4',
  paddingY: '4',
  paddingX: '5',
  borderTopWidth: '1',
  borderTopStyle: 'solid',
  borderColor: 'border.subtle',
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
  minHeight: '[56px]',
  paddingY: '2.5',
  paddingLeft: '5',
  paddingRight: '3',
  borderTopWidth: '1',
  borderTopStyle: 'solid',
  borderColor: 'border.subtle',
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

export const monogram = css({
  flexShrink: '0',
  display: 'inline-grid',
  placeItems: 'center',
  // --mono is the element stroke color of the project's palette
  backgroundColor: '[var(--mono)]',
  color: '[#ffffff]',
  fontFamily: 'body',
  fontWeight: 'semibold',
  letterSpacing: '[0.02em]',
  borderRadius: 'sm',
  '&[data-size="lg"]': {
    width: '[36px]',
    height: '[36px]',
    fontSize: 'sm',
  },
  '&[data-size="sm"]': {
    width: '[24px]',
    height: '[24px]',
    fontSize: 'xxs',
  },
  '&[data-size="chip"]': {
    width: '[20px]',
    height: '[20px]',
    fontSize: 'micro',
  },
  '&[data-size="mini"]': {
    width: '[22px]',
    height: '[22px]',
    fontSize: 'micro',
    // ring in the card surface, so overlapping monograms stay readable
    boxShadow: '[0 0 0 2px var(--colors-surface-default)]',
    cursor: '[help]',
  },
})

export const miniMore = css({
  display: 'inline-grid',
  placeItems: 'center',
  width: '[22px]',
  height: '[22px]',
  borderRadius: 'sm',
  fontFamily: 'mono',
  fontSize: 'micro',
  fontWeight: 'semibold',
  backgroundColor: 'surface.sunken',
  boxShadow: '[0 0 0 2px var(--colors-surface-default), inset 0 0 0 1px var(--colors-border-subtle)]',
  cursor: '[help]',
  ...textSecondary,
})

export const depEmpty = css({
  fontFamily: 'mono',
  fontSize: 'xs',
  ...textSecondary,
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
  ...textSecondary,
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
    fontFamily: 'mono',
    fontSize: 'xs',
    fontVariantNumeric: 'tabular-nums',
    ...textSecondary,
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
    fontFamily: 'mono',
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
    ...textSecondary,
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
    fontFamily: 'mono',
    fontVariantNumeric: 'tabular-nums',
  },
  '& [data-dimmed]': {
    ...textSecondary,
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
