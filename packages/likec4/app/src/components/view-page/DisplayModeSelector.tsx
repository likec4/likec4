import { CaretDownIcon } from '@radix-ui/react-icons'
import { Button, DropdownMenu, Flex, IconButton, Separator } from '@radix-ui/themes'
import { useState } from 'react'
import { keys } from 'remeda'

const Mode = {
  react: 'React',
  dot: 'Graphviz',
  mmd: 'Mermaid',
  d2: 'D2'
} as const

type DisplayMode = keyof typeof Mode

const mode_keys = keys.strict(Mode) as [DisplayMode, DisplayMode, ...DisplayMode[]]

export const DisplayModeSelector = () => {
  const [current, setCurrent] = useState<DisplayMode>('react')
  const [[first, second, ...rest], setModes] = useState(mode_keys)

  const changeMode = (mode: DisplayMode) => () => {
    if (mode === current) {
      return
    }
    setCurrent(mode)
    if (mode === first || mode === second) {
      return
    }
    // change only second
    setModes(([first, ...rest]) => [first, mode, ...rest.filter(m => m !== mode)])
  }

  return (
    <Flex
      display={{
        initial: 'none',
        sm: 'flex'
      }}
      gap='3'
      align='center'
    >
      <Button variant={current === first ? 'solid' : 'ghost'} size='1' onClick={changeMode(first)}>
        {Mode[first]}
      </Button>
      <Button
        variant={current === second ? 'solid' : 'ghost'}
        size='1'
        onClick={changeMode(second)}
      >
        {Mode[second]}
      </Button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <IconButton variant='ghost' size='1'>
            <CaretDownIcon />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          {rest.map(mode => (
            <DropdownMenu.Item key={mode} onClick={changeMode(mode)}>
              {Mode[mode]}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
      <Separator orientation='vertical' />
    </Flex>
  )
}
