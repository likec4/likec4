import { style } from "@vanilla-extract/css";

export const bottomButtonsContainer = style({
  zIndex: 100,
  position: 'absolute',
  left: 0,
  width: '100%',
  bottom: 2,
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  alignItems: 'center',
  gap: 2,
  justifyContent: 'center',
  pointerEvents: 'none',
  selectors: {
    [`:where([data-likec4-shape='browser']) &`]: {
      bottom: 4
    }
  }
})
