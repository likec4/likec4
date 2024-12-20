import { style } from "@vanilla-extract/css";

export const topLeftBtnContainer = style({
  position: 'absolute',
  left: 3,
  top: 6
})

export const topRightBtnContainer = style({
  position: 'absolute',
  top: 2,
  right: 2,
  selectors: {
    [`:where([data-likec4-shape='browser']) &`]: {
      right: 5
    },
    ':where([data-likec4-shape="cylinder"], [data-likec4-shape="storage"]) &': {
      top: 14
    },
    ':where([data-likec4-shape="queue"]) &': {
      top: 1,
      right: 12
    }
  }
})

export const bottomBtnContainer = style({
  zIndex: 100,
  position: 'absolute',
  left: 0,
  width: '100%',
  bottom: 2,
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'nowrap',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  selectors: {
    [`:where([data-likec4-shape='browser']) &`]: {
      bottom: 4
    }
  }
})
