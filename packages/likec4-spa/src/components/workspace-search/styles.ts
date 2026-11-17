import { css } from '@likec4/styles/css'

// Values follow the WorkspaceSearch component of the "LikeC4 Workspace Projects" design system

const textSecondary = {
  color: 'text.dimmed',
} as const

const meta = css.raw(textSecondary, {
  fontFamily: 'body',
  fontSize: 'xs',
  fontVariantNumeric: 'tabular-nums',
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

export const close = css(textSecondary, {
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

export const count = css(meta, {
  flexShrink: '0',
})

export const scopeNone = css({
  ...textSecondary,
  fontSize: 'xs',
  paddingX: '1',
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

export const rowMain = css({
  flex: '1',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5',
  minWidth: '0',
})

export const rowTitle = css({
  display: 'flex',
  alignItems: 'center',
  gap: 'xs',
  minWidth: '0',
})

export const rowPath = css({
  // element FQN and view id are code
  fontFamily: 'mono',
  fontSize: '[11px]',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

export const pickList = css({
  maxWidth: '[640px]',
  paddingX: '3',
})

export const foot = css({
  ...textSecondary,
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
