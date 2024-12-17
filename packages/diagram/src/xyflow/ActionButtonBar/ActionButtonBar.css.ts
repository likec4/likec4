import { style } from "@vanilla-extract/css";

export const container = style({
  zIndex: 100,
  width: '100%',
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  alignItems: 'center',
  gap: 2,
  justifyContent: 'center',
  pointerEvents: 'none',
})
