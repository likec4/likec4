import { Flex, Separator } from '@radix-ui/themes'
import { Link, useParams } from '@tanstack/react-router'
import { keys } from 'remeda'

const Mode = {
  editor: {
    label: 'Editor',
    to: '/view/$viewId/editor'
  },
  react: {
    label: 'React',
    to: '/view/$viewId'
  },
  dot: {
    label: 'Dot',
    to: '/view/$viewId/dot'
  },
  mmd: 'Mermaid',
  d2: 'D2'
} as const

type DisplayMode = keyof typeof Mode

const mode_keys = keys.strict(Mode) as [DisplayMode, DisplayMode, ...DisplayMode[]]

export const DisplayModeSelector = () => {
  const params = useParams({
    from: '/view/$viewId'
  })
  // const current = useSearchParams().mode ?? 'react'
  // const [[first, second, ...rest], setModes] = useState(mode_keys)

  // const changeMode = (mode: DisplayMode) => () => {
  //   if (mode === current) {
  //     return
  //   }
  //   updateSearchParams({ mode })
  // }

  // useEffect(() => {
  //   // change only second
  //   setModes(modes => {
  //     if (modes[0] === current || modes[1] === current) {
  //       return modes
  //     }
  //     const [first, ...rest] = modes
  //     return [first, current, ...rest.filter(m => m !== current)]
  //   })
  // }, [current])

  return (
    <Flex
      display={{
        initial: 'none',
        sm: 'flex'
      }}
      gap="3"
      align="center"
    >
      <Link
        to="/view/$viewId/editor"
        search
        activeOptions={{
          includeSearch: false
        }}
        startTransition
        className="rt-reset rt-BaseButton rt-Button rt-r-size-1"
        params={params}
        activeProps={{
          className: 'rt-variant-solid'
        }}
        inactiveProps={{
          className: 'rt-variant-ghost'
        }}
      >
        Editor
      </Link>
      <Link
        to="/view/$viewId"
        search
        startTransition
        activeOptions={{
          includeSearch: false
        }}
        className="rt-reset rt-BaseButton rt-Button rt-r-size-1"
        params={params}
        activeProps={{
          className: 'rt-variant-solid'
        }}
        inactiveProps={{
          className: 'rt-variant-ghost'
        }}
      >
        React
      </Link>
      {
        /* <Button variant={current === first ? 'solid' : 'ghost'} size='1' onClick={changeMode(first)}>
        {Mode[first]}
      </Button>
      <Button
        variant={current === second ? 'solid' : 'ghost'}
        size='1'
        onClick={changeMode(second)}
      >
        {Mode[second]}
      </Button> */
      }

      {
        /*
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          <IconButton variant='ghost' size='1'>
            <CaretDownIcon />
          </IconButton>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content size={'1'} side='bottom' align='end'>
          {rest.map(mode => (
            <DropdownMenu.Item key={mode} onClick={changeMode(mode)}>
              {Mode[mode]}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
       */
      }
      <Separator orientation="vertical" />
    </Flex>
  )
}
