import type { HexColor } from '../../types'

export const lightValue = {
  elements: {
    fill: '#caf2ff' as HexColor,
    stroke: '#a2c9d6' as HexColor,
    hiContrast: '#2a505b' as HexColor,
    loContrast: '#3c626d' as HexColor,
  },
  relationships: {
    line: '#98b6bf' as HexColor,
    label: '#2a505b' as HexColor,
    labelBg: '#caf2ff' as HexColor,
  },
}

export const darkValue = {
  elements: {
    fill: '#1F32C4' as HexColor,
    stroke: '#00129c' as HexColor,
    hiContrast: '#ffffff' as HexColor,
    loContrast: '#ffedff' as HexColor,
  },
  relationships: {
    line: '#172693' as HexColor,
    label: '#ffffff' as HexColor,
    labelBg: '#1F32C4' as HexColor,
  },
}
