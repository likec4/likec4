import { type ElementShape, ElementShapes } from '@likec4/core'
import { Button, Menu, MenuDropdown, MenuItem, MenuTarget } from '@mantine/core'
import { IconCheck, IconSelector } from '@tabler/icons-react'
import type { NodeProps } from '../../../../base/types'
import { useEnabledFeature } from '../../../../context'
import { stopPropagation } from '../../../../utils/xyflow'
import type { Types } from '../../../types'
import type { OnStyleChange } from './_shared'
import { BrowseRelationshipsButton, GoToSourceButton, useHandlers } from './_shared'
import { ColorButton } from './ColorButton'
import { Toolbar } from './Toolbar'

type ElementToolbarProps = NodeProps<Types.ElementNodeData>
export function ElementToolbar(props: ElementToolbarProps) {
  const { enableVscode, enableRelationshipBrowser } = useEnabledFeature('RelationshipBrowser', 'Vscode')
  const {
    data: {
      shape,
      fqn,
    },
  } = props

  const { elementColor, onColorPreview, onChange } = useHandlers(fqn, props)

  return (
    <Toolbar
      nodeProps={props}
      title={fqn}
      align="start">
      <ElementShapeButton
        elementShape={shape}
        onChange={onChange}
      />
      <ColorButton
        elementColor={elementColor}
        onColorPreview={onColorPreview}
        onChange={onChange}
        position="right-end"
      />
      {enableVscode && <GoToSourceButton elementId={fqn} />}
      {enableRelationshipBrowser && <BrowseRelationshipsButton fqn={fqn} />}
    </Toolbar>
  )
}

type DeploymentElementToolbarProps = NodeProps<Types.DeploymentElementNodeData>
export function DeploymentElementToolbar(props: DeploymentElementToolbarProps) {
  const { enableVscode, enableRelationshipBrowser } = useEnabledFeature('RelationshipBrowser', 'Vscode')
  const {
    data: {
      shape,
      deploymentFqn,
      modelRef,
    },
  } = props

  const { elementColor, onColorPreview, onChange } = useHandlers(deploymentFqn, props)

  return (
    <Toolbar
      nodeProps={props}
      title={deploymentFqn}
      align="start">
      <ElementShapeButton
        elementShape={shape}
        onChange={onChange}
      />
      <ColorButton
        elementColor={elementColor}
        onColorPreview={onColorPreview}
        onChange={onChange}
        position="right-end"
      />
      {enableVscode && <GoToSourceButton deploymentId={deploymentFqn} />}
      {enableRelationshipBrowser && modelRef && <BrowseRelationshipsButton fqn={modelRef} />}
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
          size="compact-xs"
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
