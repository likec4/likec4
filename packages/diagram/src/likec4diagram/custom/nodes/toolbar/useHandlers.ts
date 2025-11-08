import type { DeploymentFqn, Fqn, ThemeColor } from '@likec4/core'
import { useState } from 'react'
import { useCallbackRef } from '../../../../hooks/useCallbackRef'
import { useDiagram } from '../../../../hooks/useDiagram'
import type { Types } from '../../../types'
import type { OnStyleChange } from './types'

export function useHandlers(
  target: Fqn | DeploymentFqn,
  props: Types.NodeProps,
) {
  const diagram = useDiagram()

  const [originalColor, setOriginalColor] = useState<ThemeColor | null>(null)
  const onColorPreview = useCallbackRef((color: ThemeColor | null) => {
    if (color === null) {
      if (!originalColor) return
      setOriginalColor(null)
      diagram.updateNodeData(props.data.id, {
        color: originalColor,
      })
      return
    }
    setOriginalColor(value => value ?? props.data.color as ThemeColor)
    diagram.updateNodeData(props.data.id, {
      color,
    })
  })

  const onChange: OnStyleChange = useCallbackRef((change) => {
    const { shape, color, ...style } = change
    diagram.updateNodeData(props.data.id, {
      ...(shape && { shape }),
      ...(color && { color }),
      style,
    })
    diagram.triggerChange({
      op: 'change-element-style',
      style: change,
      targets: [target],
    })
  })

  return {
    elementColor: originalColor ?? props.data.color as ThemeColor,
    onColorPreview,
    onChange,
  }
}
