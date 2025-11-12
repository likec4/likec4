import type { LikeC4Theme, ThemeColor } from '@likec4/core'
import {
  type PopoverProps,
  Button,
  CheckIcon,
  ColorSwatch,
  Divider,
  Flex,
  Popover,
  PopoverDropdown,
  PopoverTarget,
  rem,
  Slider,
  Space,
  Stack,
  Tooltip as MantineTooltip,
  TooltipGroup,
} from '@mantine/core'
import { useUpdateEffect } from '@react-hookz/web'
import { useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { keys } from 'remeda'
import { useLikeC4Styles } from '../../../../hooks/useLikeC4Styles'
import { type ColorKey, type OnStyleChange, type ThemeColorKey, SemanticColors } from './types'

type ColorButtonProps = Omit<PopoverProps, 'onChange'> & {
  elementColor: ThemeColor
  elementOpacity?: number | undefined
  isOpacityEditable?: boolean
  onColorPreview: (color: ThemeColor | null) => void
  onChange: OnStyleChange
}

export function ColorButton({
  elementColor,
  elementOpacity,
  onColorPreview,
  isOpacityEditable = false,
  onChange,
  ...props
}: ColorButtonProps) {
  const { theme } = useLikeC4Styles()
  return (
    <Popover
      clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
      position="right-end"
      offset={2}
      withinPortal={false}
      {...props}
    >
      <PopoverTarget>
        <Button variant="subtle" color="gray" size="compact-xs" px={3}>
          <ColorSwatch
            color={theme.colors[elementColor].elements.fill}
            size={14}
            withShadow
            style={{ color: '#fff', cursor: 'pointer' }} />
        </Button>
      </PopoverTarget>
      <PopoverDropdown p={'xs'}>
        <ColorSwatches
          theme={theme}
          elementColor={elementColor}
          onColorPreview={onColorPreview}
          onChange={(color) => onChange({ color })} />
        {isOpacityEditable && (
          <>
            <Space h={'xs'} />
            <Divider label="opacity" labelPosition="left" />
            <Space h={'xs'} />
            <OpacityOption
              elementOpacity={elementOpacity}
              onOpacityChange={(opacity) => {
                onChange({ opacity })
              }} />
          </>
        )}
      </PopoverDropdown>
    </Popover>
  )
}

export function ColorSwatches({
  theme,
  elementColor,
  onColorPreview,
  onChange,
}: {
  theme: LikeC4Theme
  elementColor: ThemeColor
  onColorPreview: (color: ThemeColor | null) => void
  onChange: (color: ThemeColor) => void
}) {
  const changeColor = (color: ColorKey | ThemeColorKey) => (e: ReactMouseEvent) => {
    e.stopPropagation()
    onColorPreview(null)
    if (elementColor === color) {
      return
    }
    onChange(color)
  }

  const otherColors = keys(theme.colors).filter(color => !SemanticColors.includes(color as ThemeColorKey))

  return (
    <Stack gap={2} onMouseLeave={() => onColorPreview(null)}>
      <TooltipGroup openDelay={1000} closeDelay={300}>
        <Flex maw={120} gap="6" justify="flex-start" align="flex-start" direction="row" wrap="wrap">
          {SemanticColors.map(color => (
            <MantineTooltip
              key={color}
              label={color}
              fz={'xs'}
              color="dark"
              offset={2}
              withinPortal={false}
              transitionProps={{ duration: 140, transition: 'slide-up' }}>
              <ColorSwatch
                color={theme.colors[color].elements.fill}
                size={18}
                withShadow
                onMouseEnter={() => onColorPreview(color)}
                onClick={changeColor(color)}
                style={{ color: '#fff', cursor: 'pointer' }}
              >
                {elementColor === color && <CheckIcon style={{ width: rem(10), height: rem(10) }} />}
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
          {otherColors.map(key => (
            <MantineTooltip
              key={key}
              label={key}
              fz={'xs'}
              color="dark"
              offset={2}
              transitionProps={{ duration: 140, transition: 'slide-up' }}>
              <ColorSwatch
                color={theme.colors[key].elements.fill}
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

export function OpacityOption({
  elementOpacity = 100,
  onOpacityChange,
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
