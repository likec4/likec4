import { styled } from '@likec4/styles/jsx'
import { IconSearch } from '@tabler/icons-react'
import { useWorkspaceSearchActions } from './store'

/**
 * Field in the toolbar that opens the workspace search; typing into it opens the search with that text
 */
export function WorkspaceSearchTrigger({ label = 'Search elements and views in all projects' }: {
  label?: string
}) {
  const { open } = useWorkspaceSearchActions()
  return <SearchTrigger label={label} onOpen={query => open({ query })} />
}

/**
 * Field-like button with the search shortcut
 */
export function SearchTrigger({ label, onOpen }: {
  label: string
  /**
   * Called on click with an empty text, or with the first typed character
   */
  onOpen: (query: string) => void
}) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <Trigger
      type="button"
      className="group"
      aria-label={label}
      aria-keyshortcuts="Meta+K /"
      onClick={() => onOpen('')}
      onKeyDown={e => {
        if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && e.key !== ' ') {
          e.preventDefault()
          onOpen(e.key)
        }
      }}>
      <IconSearch size={16} aria-hidden />
      <Label>{label}</Label>
      <Shortcut aria-hidden="true">{isMac ? '⌘ + K' : 'Ctrl + K'}</Shortcut>
    </Trigger>
  )
}

const Trigger = styled('button', {
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    flex: '[1 1 280px]',
    maxWidth: '[420px]',
    height: '[32px]',
    paddingLeft: '[10px]',
    paddingRight: '2',
    borderRadius: 'sm',
    borderWidth: '1',
    borderStyle: 'solid',
    borderColor: 'border.subtle',
    backgroundColor: 'surface.field',
    color: 'text.dimmed',
    fontFamily: 'body',
    fontSize: 'sm',
    textAlign: 'left',
    cursor: '[text]',
    _hover: {
      borderColor: 'border.default',
    },
    '& > svg': {
      flexShrink: '0',
    },
  },
})

const Label = styled('span', {
  base: {
    flex: '1',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
})

/**
 * Same as the shortcut of the diagram SearchControl
 */
const Shortcut = styled('span', {
  base: {
    flexShrink: '0',
    fontSize: 'xxs',
    fontWeight: 'bold',
    lineHeight: 'tight',
    padding: '[4px 7px]',
    borderRadius: 'sm',
    border: 'default',
    whiteSpace: 'nowrap',
    transition: 'fast',
    _light: {
      color: 'mantine.gray[7]',
      borderColor: 'mantine.gray[2]',
    },
    _dark: {
      color: 'mantine.dark[0]',
      borderColor: 'mantine.dark[7]',
    },
    backgroundColor: {
      _light: 'mantine.gray[2]/70',
      _dark: 'mantine.dark[8]/70',
      _groupHover: {
        _light: 'mantine.gray[2]',
        _dark: 'mantine.dark[8]',
      },
    },
  },
})
