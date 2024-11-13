import {
  type BorderStyle,
  defaultTheme,
  type Element,
  ElementShapes,
  type Fqn,
  type NonEmptyArray,
  type ThemeColor,
  type ViewChange
} from '@likec4/core'
import {
  ActionIcon,
  Box,
  Button,
  CheckIcon,
  ColorSwatch,
  Divider,
  Flex,
  Group,
  keys,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuTarget,
  Paper,
  Popover,
  PopoverDropdown,
  type PopoverProps,
  PopoverTarget,
  rem,
  SegmentedControl,
  Slider,
  Space,
  Stack,
  Text,
  Tooltip as MantineTooltip,
  TooltipGroup
} from '@mantine/core'
import { IconCheck, IconFileSymlink, IconSelector, IconTransform } from '@tabler/icons-react'
import { NodeToolbar, type NodeToolbarProps } from '@xyflow/react'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { useDiagramState, useDiagramStoreApi, useMantinePortalProps, useUpdateEffect } from '../../../hooks'
import { stopPropagation } from '../../utils'

const {
  primary,
  secondary,
  muted,
  ...otherColors
} = defaultTheme.elements

const themedColors = [
  { key: 'primary', value: primary.fill },
  { key: 'secondary', value: secondary.fill },
  { key: 'muted', value: muted.fill }
] satisfies Array<{ key: ThemeColor; value: string }>

const colors = keys(otherColors).map(key => ({
  key,
  value: defaultTheme.elements[key].fill
}))

type ThemeColorKey = typeof themedColors[0]['key']
type ColorKey = typeof colors[0]['key']

const Tooltip = MantineTooltip.withProps({
  color: 'dark',
  fz: 'xs',
  openDelay: 400,
  closeDelay: 150,
  label: '',
  children: null,
  offset: 4
})

type ToolbarProps = NodeToolbarProps & {
  element: Element
  onColorPreview: (color: ThemeColor | null) => void
}

type OnStyleChange = (style: ViewChange.ChangeElementStyle['style']) => void

export function CompoundToolbar({
  element,
  onColorPreview,
  ...props
}: ToolbarProps) {
  const targets = [element.id] as NonEmptyArray<Fqn>
  const diagramApi = useDiagramStoreApi()
  const {
    hasGoToSource,
    enableRelationshipBrowser
  } = useDiagramState(s => ({
    hasGoToSource: !!s.onOpenSourceElement,
    enableRelationshipBrowser: s.enableRelationshipBrowser
  }))

  const onChange: OnStyleChange = (style) => {
    diagramApi.getState().triggerChangeElementStyle({
      op: 'change-element-style',
      style,
      targets
    })
  }

  return (
    <Toolbar element={element} {...props}>
      <ColorButton
        element={element}
        isOpacityEditable
        onColorPreview={onColorPreview}
        onChange={onChange}
        position="left-start"
      />
      <BorderStyleOption
        elementBorderStyle={element.style?.border}
        onChange={onChange}
      />
      {hasGoToSource && <GoToSourceButton elementId={element.id} />}
      {enableRelationshipBrowser && <BrowseRelationshipsButton elementId={element.id} />}
    </Toolbar>
  )
}

function Toolbar({ element, children, ...props }: Omit<ToolbarProps, 'onColorPreview'>) {
  return (
    <NodeToolbar {...props}>
      <Paper
        className={clsx('nodrag', 'nopan')}
        px={5}
        pb={8}
        pt={4}
        radius={'sm'}
        shadow="xl"
        onDoubleClickCapture={stopPropagation}
        onPointerDown={stopPropagation}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
        withBorder>
        <Stack gap={4}>
          <Box pl={2}>
            <Text c="dimmed" fz={10} fw={500}>{element.id}</Text>
          </Box>
          <Group gap={3}>
            {children}
          </Group>
        </Stack>
      </Paper>
    </NodeToolbar>
  )
}

export function ElementToolbar({
  element,
  onColorPreview,
  ...props
}: ToolbarProps) {
  const targets = [element.id] as NonEmptyArray<Fqn>
  const diagramApi = useDiagramStoreApi()
  const {
    hasGoToSource,
    enableRelationshipBrowser
  } = useDiagramState(s => ({
    hasGoToSource: !!s.onOpenSourceElement,
    enableRelationshipBrowser: s.enableRelationshipBrowser
  }))
  const portalProps = useMantinePortalProps()

  const onChange: OnStyleChange = (style) => {
    diagramApi.getState().triggerChangeElementStyle({
      op: 'change-element-style',
      style,
      targets
    })
  }

  return (
    <Toolbar element={element} {...props}>
      <Menu
        openDelay={300}
        closeDelay={450}
        floatingStrategy={'fixed'}
        closeOnClickOutside
        clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
        closeOnEscape
        closeOnItemClick={false}
        position="bottom-start"
        offset={2}
        styles={{
          item: {
            padding: 'calc(var(--mantine-spacing-xs) / 1.5) var(--mantine-spacing-xs)'
          }
        }}
        {...portalProps}
      >
        <MenuTarget>
          <Button
            variant="light"
            color="gray"
            size="compact-xs"
            rightSection={<IconSelector size={12} />}
          >
            {element.shape}
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
              rightSection={element.shape === shape ? <IconCheck size={12} /> : undefined}
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
      <ColorButton
        element={element}
        onColorPreview={onColorPreview}
        onChange={onChange}
        position="right-end"
      />
      {hasGoToSource && <GoToSourceButton elementId={element.id} />}
      {enableRelationshipBrowser && <BrowseRelationshipsButton elementId={element.id} />}
    </Toolbar>
  )
}

type ColorButtonProps = Omit<PopoverProps, 'onChange'> & {
  element: Element
  isOpacityEditable?: boolean
  onColorPreview: (color: ThemeColor | null) => void
  onChange: OnStyleChange
}

function GoToSourceButton({ elementId }: { elementId: Fqn }) {
  const diagramApi = useDiagramStoreApi()
  const portalProps = useMantinePortalProps()
  return (
    <Tooltip label={'Open source'} {...portalProps}>
      <ActionIcon
        size={'sm'}
        variant="subtle"
        color="gray"
        onClick={e => {
          e.stopPropagation()
          diagramApi.getState().onOpenSourceElement?.(elementId)
        }}>
        <IconFileSymlink stroke={1.8} style={{ width: '70%' }} />
      </ActionIcon>
    </Tooltip>
  )
}

function ColorButton({
  element,
  onColorPreview,
  isOpacityEditable = false,
  onChange,
  ...props
}: ColorButtonProps) {
  const elementColor: ThemeColor = (element.color as ThemeColor) ?? 'primary'
  return (
    <Popover
      clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
      position="right-end"
      offset={2}
      {...props}
    >
      <PopoverTarget>
        <Button variant="subtle" color="gray" size="compact-xs" px={3}>
          <ColorSwatch
            color={defaultTheme.elements[elementColor]?.fill}
            size={14}
            withShadow
            style={{ color: '#fff', cursor: 'pointer' }}
          />
        </Button>
      </PopoverTarget>
      <PopoverDropdown p={'xs'}>
        <ColorSwatches
          elementColor={elementColor}
          onColorPreview={onColorPreview}
          onChange={(color) => onChange({ color })}
        />
        {isOpacityEditable && (
          <>
            <Space h={'xs'} />
            <Divider label="opacity" labelPosition="left" />
            <Space h={'xs'} />
            <OpacityOption
              elementOpacity={element.style?.opacity}
              onOpacityChange={(opacity) => {
                onChange({ opacity })
              }} />
          </>
        )}
      </PopoverDropdown>
    </Popover>
  )
}

function ColorSwatches({
  elementColor,
  onColorPreview,
  onChange
}: {
  elementColor: ThemeColor
  onColorPreview: (color: ThemeColor | null) => void
  onChange: (color: ThemeColor) => void
}) {
  const changeColor = (color: ColorKey | ThemeColorKey) => (e: React.MouseEvent) => {
    e.stopPropagation()
    onColorPreview(null)
    if (elementColor === color) {
      return
    }
    onChange(color)
  }
  return (
    <Stack gap={2} onMouseLeave={() => onColorPreview(null)}>
      <TooltipGroup openDelay={1000} closeDelay={300}>
        <Flex maw={120} gap="6" justify="flex-start" align="flex-start" direction="row" wrap="wrap">
          {themedColors.map(({ key, value }) => (
            <MantineTooltip
              key={key}
              label={key}
              fz={'xs'}
              color="dark"
              offset={2}
              transitionProps={{ duration: 140, transition: 'slide-up' }}>
              <ColorSwatch
                color={value}
                size={18}
                withShadow
                onMouseEnter={() => onColorPreview(key)}
                onClick={changeColor(key)}
                style={{ color: '#fff', cursor: 'pointer' }}
              >
                {elementColor === key && <CheckIcon style={{ width: rem(10), height: rem(10) }} />}
              </ColorSwatch>
            </MantineTooltip>
          ))}
        </Flex>

        <Flex
          mt="sm"
          maw={110}
          gap="6"
          justify="flex-start"
          align="flex-start"
          direction="row"
          wrap="wrap">
          {colors.map(({ key, value }) => (
            <MantineTooltip
              key={key}
              label={key}
              fz={'xs'}
              color="dark"
              offset={2}
              transitionProps={{ duration: 140, transition: 'slide-up' }}>
              <ColorSwatch
                color={value}
                size={18}
                onMouseEnter={() => onColorPreview(key)}
                onClick={changeColor(key)}
                style={{ color: '#fff', cursor: 'pointer' }}
              >
                {elementColor === key && <CheckIcon style={{ width: rem(10), height: rem(10) }} />}
              </ColorSwatch>
            </MantineTooltip>
          ))}
        </Flex>
      </TooltipGroup>
    </Stack>
  )
}

function BorderStyleOption({
  elementBorderStyle = 'dashed',
  onChange
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
            paddingBottom: 2
          }
        }}
        data={[
          { label: 'Solid', value: 'solid' },
          { label: 'Dashed', value: 'dashed' },
          { label: 'Dotted', value: 'dotted' },
          { label: 'None', value: 'none' }
        ]}
      />
    </Box>
  )
}

function OpacityOption({
  elementOpacity = 100,
  onOpacityChange
}: {
  elementOpacity: number | undefined
  onOpacityChange: (opacity: number) => void
}) {
  const [value, setValue] = useState(elementOpacity)
  useUpdateEffect(() => {
    setValue(elementOpacity)
  }, [elementOpacity])

  return (
    <Slider
      size={'sm'}
      color={'dark'}
      value={value}
      onChange={setValue}
      onChangeEnd={onOpacityChange} />
  )
}

function BrowseRelationshipsButton({ elementId }: { elementId: Fqn }) {
  const diagramApi = useDiagramStoreApi()
  const portalProps = useMantinePortalProps()
  return (
    <Tooltip label={'Browse relationships'} {...portalProps}>
      <ActionIcon
        size={'sm'}
        variant="subtle"
        color="gray"
        onClick={e => {
          e.stopPropagation()
          diagramApi.getState().openOverlay({
            relationshipsOf: elementId
          })
        }}>
        <IconTransform
          stroke={2}
          style={{
            width: '72%',
            height: '72%'
          }} />
      </ActionIcon>
    </Tooltip>
  )
}
