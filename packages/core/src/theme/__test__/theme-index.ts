import type { HexColor } from '../../types'

export const lightValue = {
  elements: {
    fill: '#2ec2fb' as HexColor,
    stroke: '#1fabe1' as HexColor,
    hiContrast: '#00002d' as HexColor,
    loContrast: '#00153d' as HexColor,
  },
  relationships: {
    line: '#4ccdfb' as HexColor,
    label: '#6fd8fc' as HexColor,
    labelBg: '#0084b2' as HexColor,
  },
}

export const darkValue = {
  elements: {
    fill: '#2c40dc' as HexColor,
    stroke: '#1f32c4' as HexColor,
    hiContrast: '#ffffff' as HexColor,
    loContrast: '#fffeff' as HexColor,
  },
  relationships: {
    line: '#5362e1' as HexColor,
    label: '#7a87e9' as HexColor,
    labelBg: '#0a259c' as HexColor,
  },
}
