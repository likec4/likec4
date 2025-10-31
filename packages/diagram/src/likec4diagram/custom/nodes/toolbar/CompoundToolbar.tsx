import type { BorderStyle } from '@likec4/core'
import { Box, SegmentedControl } from '@mantine/core'
import { useEffect, useState } from 'react'
import { useEnabledFeatures } from '../../../../context/DiagramFeatures'
import type { Types } from '../../../types'
import { BrowseRelationshipsButton, GoToSourceButton } from './_shared'
import { ColorButton } from './ColorButton'
import { Toolbar } from './Toolbar'
import type { OnStyleChange } from './types'
import { useHandlers } from './useHandlers'

export function CompoundElementToolbar(props: Types.NodeProps<'compound-element'>) {
  const { enableVscode, enableRelationshipBrowser } = useEnabledFeatures()
  const {
    data: {
      style,
      modelFqn,
    },
  } = props

  const { elementColor, onColorPreview, onChange } = useHandlers(modelFqn, props)
  const opacity = style?.opacity ?? 100
  return (
    <Toolbar
      nodeProps={props}
      title={modelFqn}
      align="start">
      <ColorButton
        elementColor={elementColor}
        onColorPreview={onColorPreview}
        isOpacityEditable
        elementOpacity={opacity}
        onChange={onChange}
        position="left-start"
      />
      <BorderStyleOption
        elementBorderStyle={style?.border ?? (opacity < 99 ? 'dashed' : 'none')}
        onChange={onChange}
      />
      {enableVscode && <GoToSourceButton elementId={modelFqn} />}
      {enableRelationshipBrowser && <BrowseRelationshipsButton fqn={modelFqn} />}
    </Toolbar>
  )
}

export function CompoundDeploymentToolbar(props: Types.NodeProps<'compound-deployment'>) {
  const { enableVscode, enableRelationshipBrowser } = useEnabledFeatures()
  const {
    data: {
      deploymentFqn,
      style,
      modelFqn,
    },
  } = props

  const { elementColor, onColorPreview, onChange } = useHandlers(deploymentFqn, props)

  return (
    <Toolbar
      nodeProps={props}
      title={deploymentFqn}
      align="start">
      <ColorButton
        elementColor={elementColor}
        onColorPreview={onColorPreview}
        isOpacityEditable
        elementOpacity={style?.opacity}
        onChange={onChange}
        position="left-start"
      />
      <BorderStyleOption
        elementBorderStyle={style?.border}
        onChange={onChange}
      />
      {enableVscode && <GoToSourceButton deploymentId={deploymentFqn} />}
      {enableRelationshipBrowser && modelFqn && <BrowseRelationshipsButton fqn={modelFqn} />}
    </Toolbar>
  )
}

function BorderStyleOption({
  elementBorderStyle = 'dashed',
  onChange,
}: {
  elementBorderStyle: BorderStyle | undefined
  onChange: OnStyleChange
}) {
  const [value, setValue] = useState(elementBorderStyle)
  useEffect(() => {
    setValue(elementBorderStyle)
  }, [elementBorderStyle])

  return (
    <Box>
      <SegmentedControl
        size="xs"
        fullWidth
        withItemsBorders={false}
        value={value}
        onChange={v => {
          const border = v as BorderStyle
          setValue(border)
          onChange({ border })
        }}
        styles={{
          label: {
            paddingTop: '0.5',
            paddingBottom: '0.5',
          },
        }}
        data={[
          { label: 'Solid', value: 'solid' },
          { label: 'Dashed', value: 'dashed' },
          { label: 'Dotted', value: 'dotted' },
          { label: 'None', value: 'none' },
        ]}
      />
    </Box>
  )
}
