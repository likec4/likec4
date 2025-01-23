import { type ThemeColor, defaultTheme } from '@likec4/core'
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
import { type ColorKey, type OnStyleChange, type ThemeColorKey, colors, themedColors } from './_shared'

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
            color={defaultTheme.elements[elementColor]?.fill}
            size={14}
            withShadow
            style={{ color: '#fff', cursor: 'pointer' }} />
        </Button>
      </PopoverTarget>
      <PopoverDropdown p={'xs'}>
        <ColorSwatches
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
  elementColor,
  onColorPreview,
  onChange,
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
              withinPortal={false}
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
