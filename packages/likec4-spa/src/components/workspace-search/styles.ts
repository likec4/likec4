import { css } from '@likec4/styles/css'

// Values follow the WorkspaceSearch component of the "LikeC4 Workspace Projects" design system

const textSecondary = {
  color: '[var(--mantine-color-gray-7)]',
  _dark: {
    color: '[var(--mantine-color-dark-1)]',
  },
} as const

const mono = {
  fontFamily: 'mono',
  fontSize: '[11px]',
  ...textSecondary,
} as const

export const dialog = css({
  backgroundColor: '[color-mix(in srgb, var(--colors-surface-canvas) 92%, transparent)]',
  backdropFilter: 'auto',
  backdropBlur: '[10px]',
})

export const body = css({
  width: '100%',
  height: '100%',
  maxHeight: '100vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  gap: '3',
  paddingTop: '5',
  paddingX: '4',
  background: 'transparent',
  fontFamily: 'body',
  color: 'text',
})

export const top = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '2',
  paddingX: '3',
})

export const input = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  height: '[48px]',
  paddingLeft: '3',
  paddingRight: '2',
  borderRadius: 'md',
  borderWidth: '1',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
  backgroundColor: 'surface.field',
  _focusWithin: {
    borderColor: 'primary.border',
    boxShadow: '[0 0 0 1px var(--colors-primary-border)]',
  },
  '& > svg': {
    flexShrink: '0',
    ...textSecondary,
  },
  '& input': {
    flex: '1',
    minWidth: '0',
    height: '100%',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'text.bright',
    fontFamily: 'body',
    fontSize: 'lg',
    outline: 'none',
    _placeholder: {
      color: 'text.dimmed',
    },
  },
})

export const scopeToken = css({
  display: 'inline-flex',
  flexShrink: '1',
  minWidth: '0',
  maxWidth: '[240px]',
  alignItems: 'center',
  gap: '1.5',
  height: '[26px]',
  paddingLeft: '[3px]',
  paddingRight: '1',
  borderRadius: 'sm',
  backgroundColor: 'primary.body.light',
  color: 'primary.text.light',
  fontSize: 'sm',
  fontWeight: 'medium',
  whiteSpace: 'nowrap',
  '& button': {
    display: 'inline-grid',
    placeItems: 'center',
    width: '[18px]',
    height: '[18px]',
    border: 'none',
    borderRadius: '[3px]',
    backgroundColor: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
    _hover: {
      backgroundColor: 'primary.body.lightHover',
    },
  },
})

export const close = css({
  flexShrink: '0',
  display: 'inline-grid',
  placeItems: 'center',
  width: '[32px]',
  height: '[32px]',
  borderWidth: '1',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
  borderRadius: 'sm',
  backgroundColor: 'surface.default',
  cursor: 'pointer',
  ...textSecondary,
  _hover: {
    color: 'text',
  },
})

export const scopes = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '1.5',
  minHeight: '[28px]',
})

export const scope = css({
  display: 'inline-flex',
  maxWidth: '[240px]',
  alignItems: 'center',
  gap: '1.5',
  height: '[28px]',
  paddingLeft: '[3px]',
  paddingRight: '2',
  borderRadius: 'sm',
  borderWidth: '1',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
  backgroundColor: 'surface.default',
  color: 'text',
  fontFamily: 'body',
  fontSize: 'xs',
  fontWeight: 'medium',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  _hover: {
    borderColor: 'border.default',
  },
  '&[data-all]': {
    paddingLeft: '2',
  },
  '&[aria-pressed="true"]': {
    borderColor: 'primary.border',
    backgroundColor: 'primary.body.light',
    color: 'primary.text.light',
  },
  '&[aria-pressed="true"] [data-count]': {
    color: 'inherit',
  },
})

export const count = css({ ...mono, flexShrink: '0' })

export const scopeNone = css({
  fontSize: 'xs',
  paddingX: '1',
  ...textSecondary,
})

export const hint = css({
  paddingX: '3',
  paddingY: '6',
  fontSize: 'sm',
  ...textSecondary,
  '& code': {
    fontFamily: 'mono',
    fontSize: 'xs',
    paddingX: '1',
    borderRadius: 'xs',
    backgroundColor: 'surface.sunken',
    color: 'text',
  },
})

export const cols = css({
  flex: '1',
  minHeight: '0',
  display: 'grid',
  gridTemplateColumns: { base: '1fr', md: '1fr 1fr' },
  gap: '4',
})

export const col = css({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '0',
})

export const colTitle = css({
  display: 'flex',
  alignItems: 'baseline',
  gap: '2',
  paddingX: '3',
  paddingBottom: '2',
  fontSize: 'sm',
  fontWeight: 'semibold',
  ...textSecondary,
})

export const list = css({
  flex: '1',
  minHeight: '0',
  overflowY: 'auto',
  paddingX: '3',
  paddingBottom: '4',
})

export const groupHead = css({
  minWidth: '0',
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  paddingY: '1.5',
  backgroundColor: '[color-mix(in srgb, var(--colors-surface-canvas) 96%, transparent)]',
  fontSize: 'xs',
  fontWeight: 'semibold',
  color: 'text',
})

export const linkButton = css({
  marginLeft: 'auto',
  border: 'none',
  backgroundColor: 'transparent',
  color: 'text.link',
  fontFamily: 'body',
  fontSize: 'xs',
  fontWeight: 'medium',
  cursor: 'pointer',
  paddingX: '1',
  paddingY: '0.5',
  borderRadius: '[3px]',
  _hover: {
    textDecoration: 'underline',
  },
})

export const virtualInner = css({
  position: 'relative',
  width: '100%',
})

export const virtualItem = css({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  '&[data-sticky]': {
    position: 'sticky',
    zIndex: '[1]',
  },
})

export const rows = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5',
})

export const row = css({
  display: 'grid',
  gridTemplateColumns: '[22px 1fr auto]',
  alignItems: 'start',
  columnGap: '2.5',
  width: '100%',
  paddingY: '2',
  paddingX: '3',
  borderWidth: '1',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
  borderRadius: 'sm',
  backgroundColor: 'surface.default',
  color: 'inherit',
  fontFamily: 'body',
  textAlign: 'left',
  cursor: 'pointer',
  outline: 'none',
  _hover: {
    borderColor: 'border.default',
  },
  _focus: {
    borderColor: 'primary.border',
    boxShadow: '[0 0 0 1px var(--colors-primary-border)]',
    backgroundColor: '[color-mix(in srgb, var(--colors-primary-body-light) 50%, var(--colors-surface-default))]',
  },
  '& > svg': {
    marginTop: '[1px]',
    ...textSecondary,
  },
})

export const rowMain = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5',
  minWidth: '0',
})

export const rowTitle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  minWidth: '0',
  fontSize: 'md',
  fontWeight: 'medium',
  color: 'text.bright',
  '& > span:first-child': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
})

export const kind = css({
  flexShrink: '0',
  fontFamily: 'mono',
  fontSize: 'xxs',
  paddingX: '[5px]',
  paddingY: '[1px]',
  borderRadius: 'xs',
  backgroundColor: 'surface.sunken',
  ...textSecondary,
})

export const rowPath = css({
  ...mono,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const rowDesc = css({
  fontSize: 'xs',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  ...textSecondary,
})

export const rowMeta = css({
  ...mono,
  whiteSpace: 'nowrap',
  paddingTop: '0.5',
})

export const pickHead = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  paddingX: '3',
  paddingBottom: '2',
  fontSize: 'sm',
  ...textSecondary,
  '& b': {
    color: 'text.bright',
    fontWeight: 'semibold',
  },
})

export const pickList = css({
  maxWidth: '[640px]',
  paddingX: '3',
})

export const foot = css({
  flexShrink: '0',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: '4',
  minHeight: '[40px]',
  paddingX: '3',
  borderTopWidth: '1',
  borderTopStyle: 'solid',
  borderColor: 'border.subtle',
  fontSize: 'xs',
  ...textSecondary,
  '& kbd': {
    display: 'inline-block',
    minWidth: '[18px]',
    marginRight: '1',
    paddingX: '1',
    paddingY: '[1px]',
    borderRadius: 'xs',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'border.default',
    backgroundColor: 'surface.default',
    fontFamily: 'mono',
    fontSize: 'xxs',
    textAlign: 'center',
    color: 'text',
  },
})

export const status = css({
  marginLeft: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2',
  '&::before': {
    content: '""',
    width: '[6px]',
    height: '[6px]',
    borderRadius: '[50%]',
    backgroundColor: '[var(--mantine-color-green-6)]',
  },
  '&[data-loading]::before': {
    backgroundColor: '[var(--mantine-color-yellow-6)]',
  },
})

export const trigger = css({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  flex: '[1 1 280px]',
  maxWidth: '[420px]',
  height: '[32px]',
  paddingLeft: '[10px]',
  paddingRight: '2',
  borderRadius: 'sm',
  borderWidth: '1',
  borderStyle: 'solid',
  borderColor: 'border.subtle',
  backgroundColor: 'surface.field',
  color: 'text.dimmed',
  fontFamily: 'body',
  fontSize: 'sm',
  textAlign: 'left',
  cursor: '[text]',
  _hover: {
    borderColor: 'border.default',
  },
  '& > svg': {
    flexShrink: '0',
    ...textSecondary,
  },
  '& > span:nth-of-type(1)': {
    flex: '1',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
})

/**
 * Same as the shortcut of the diagram SearchControl
 */
export const kbd = css({
  flexShrink: '0',
  fontSize: 'xxs',
  fontWeight: 'bold',
  lineHeight: 'tight',
  padding: '[4px 7px]',
  borderRadius: 'sm',
  border: 'default',
  whiteSpace: 'nowrap',
  transition: 'fast',
  _light: {
    color: 'mantine.gray[7]',
    borderColor: 'mantine.gray[2]',
  },
  _dark: {
    color: 'mantine.dark[0]',
    borderColor: 'mantine.dark[7]',
  },
  backgroundColor: {
    _light: 'mantine.gray[2]/70',
    _dark: 'mantine.dark[8]/70',
    _groupHover: {
      _light: 'mantine.gray[2]',
      _dark: 'mantine.dark[8]',
    },
  },
})

export const truncate = css({
  minWidth: '0',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})
