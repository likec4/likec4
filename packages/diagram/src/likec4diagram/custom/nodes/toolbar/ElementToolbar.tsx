import { type ElementShape, ElementShapes } from '@likec4/core/styles'
import { Button, Menu, MenuDropdown, MenuItem, MenuTarget } from '@mantine/core'
import { IconCheck, IconSelector } from '@tabler/icons-react'
import { useEnabledFeatures } from '../../../../context/DiagramFeatures'
import { stopPropagation } from '../../../../utils/xyflow'
import type { Types } from '../../../types'
import { BorderStyleOption, BrowseRelationshipsButton, GoToSourceButton } from './_shared'
import { ColorButton } from './ColorButton'
import { Toolbar } from './Toolbar'
import type { OnStyleChange } from './types'
import { useHandlers } from './useHandlers'

export function ElementToolbar(props: Types.NodeProps<'element'>) {
  const { enableVscode, enableRelationshipBrowser } = useEnabledFeatures()
  const {
    data: {
      shape,
      modelFqn,
      style,
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
        onChange={onChange}
      />
      <ElementShapeButton
        elementShape={shape}
        onChange={onChange}
      />
      <BorderStyleOption
        elementBorderStyle={style?.border ?? 'none'}
        onChange={onChange}
      />
      {enableVscode && <GoToSourceButton elementId={modelFqn} />}
      {enableRelationshipBrowser && <BrowseRelationshipsButton fqn={modelFqn} />}
    </Toolbar>
  )
}

export function DeploymentElementToolbar(props: Types.NodeProps<'deployment'>) {
  const { enableVscode, enableRelationshipBrowser } = useEnabledFeatures()
  const {
    data: {
      shape,
      deploymentFqn,
      modelFqn,
      style,
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
        onChange={onChange}
      />
      <ElementShapeButton
        elementShape={shape}
        onChange={onChange}
      />
      <BorderStyleOption
        elementBorderStyle={style?.border ?? 'none'}
        onChange={onChange}
      />
      {enableVscode && <GoToSourceButton deploymentId={deploymentFqn} />}
      {enableRelationshipBrowser && modelFqn && <BrowseRelationshipsButton fqn={modelFqn} />}
    </Toolbar>
  )
}

function ElementShapeButton({
  elementShape,
  onChange,
}: {
  elementShape: ElementShape
  onChange: OnStyleChange
}) {
  return (
    <Menu
      openDelay={300}
      closeDelay={450}
      floatingStrategy={'fixed'}
      closeOnClickOutside
      clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
      closeOnEscape
      closeOnItemClick={false}
      position="top-start"
      offset={2}
      styles={{
        item: {
          padding: 'calc(var(--mantine-spacing-xs) / 1.5) var(--mantine-spacing-xs)',
        },
      }}
      withinPortal={false}
    >
      <MenuTarget>
        <Button
          variant="light"
          color="gray"
          size="xs"
          px={8}
          rightSection={<IconSelector size={12} />}
        >
          {elementShape}
        </Button>
      </MenuTarget>
      <MenuDropdown
        // className={css.menuDropdown}
        // onPointerDownCapture={stopEventPropagation}
        // onPointerDown={stopEventPropagation}
        onDoubleClick={stopPropagation}
        onClick={stopPropagation}
      >
        {ElementShapes.map(shape => (
          <MenuItem
            fz={12}
            fw={500}
            key={shape}
            value={shape}
            rightSection={elementShape === shape ? <IconCheck size={12} /> : undefined}
            onClick={e => {
              e.stopPropagation()
              onChange({ shape })
            }}
          >
            {shape}
          </MenuItem>
        ))}
      </MenuDropdown>
    </Menu>
  )
}
