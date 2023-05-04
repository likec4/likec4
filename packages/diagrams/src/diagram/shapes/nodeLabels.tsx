import type { DiagramNode, ThemeColor } from '@likec4/core/types'
import { pluck, uniq } from 'rambdax'
import { Text } from '../../konva'
import type { DiagramTheme } from '../types'


type NodeLabelsProps = {
  labels: DiagramNode['labels']
  color: ThemeColor
  width: number
  offsetX?: number
  offsetY?: number
  theme: DiagramTheme
}

export function NodeLabels({
  labels, color, width, theme, offsetX = 0, offsetY = 0
}: NodeLabelsProps) {
  const colors = theme.colors[color]
  const [
    _titleFontSize, descriptionFontSize
  ] = uniq(pluck('fontSize', labels)).sort().reverse()
  return <>
    {labels.map((label, i) => {
      let color = colors.hiContrast
      if (descriptionFontSize && descriptionFontSize === label.fontSize) {
        color = colors.loContrast
      }
      return <Text
        key={i}
        // x={label.pt[0]}
        x={8}
        width={width - 16}
        y={label.pt[1] - (label.fontSize / 2)}
        offsetY={offsetY}
        offsetX={offsetX}
        // offsetY={label.fontSize / 2}
        // offsetX={label.width / 2}
        // width={label.width}
        fill={color}
        fontFamily='Helvetica'
        fontSize={label.fontSize}
        padding={0}
        fontStyle={label.fontStyle ?? 'normal'}
        align={'center'}
        text={label.text}
        strokeEnabled={false}
        perfectDrawEnabled={false}
        hitStrokeWidth={0}
        listening={false}
         />
    }
    )}
  </>
}
