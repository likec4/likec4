import { type BorderStyle } from '@likec4/core'
import { Box, SegmentedControl } from '@mantine/core'
import { useEffect, useState } from 'react'
import type { NodeProps } from '../../../../base/types'
import { useEnabledFeature } from '../../../../context'
import type { Types } from '../../../types'
import type { OnStyleChange } from './_shared'
import { BrowseRelationshipsButton, GoToSourceButton, useHandlers } from './_shared'
import { ColorButton } from './ColorButton'
import { Toolbar } from './Toolbar'

type CompoundElementToolbarProps = NodeProps<Types.CompoundElementNodeData>
export function CompoundElementToolbar(props: CompoundElementToolbarProps) {
  const { enableVscode, enableRelationshipBrowser } = useEnabledFeature('RelationshipBrowser', 'Vscode')
  const {
    data: {
      style,
      modelFqn,
    },
  } = props

  const { elementColor, onColorPreview, onChange } = useHandlers(modelFqn, props)

  return (
    <Toolbar
      nodeProps={props}
      title={modelFqn}
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
      {enableVscode && <GoToSourceButton elementId={modelFqn} />}
      {enableRelationshipBrowser && <BrowseRelationshipsButton fqn={modelFqn} />}
    </Toolbar>
  )
}

type CompoundDeploymentToolbarProps = NodeProps<Types.CompoundDeploymentNodeData>
export function CompoundDeploymentToolbar(props: CompoundDeploymentToolbarProps) {
  const { enableVscode, enableRelationshipBrowser } = useEnabledFeature('RelationshipBrowser', 'Vscode')
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
            paddingTop: 2,
            paddingBottom: 2,
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
