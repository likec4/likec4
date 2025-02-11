import { compareNatural } from '@likec4/core'
import {
  Combobox,
  ComboboxDropdown,
  ComboboxOption,
  ComboboxOptions,
  ComboboxTarget,
  Input,
  rem,
  ScrollAreaAutosize,
  Text,
  useCombobox,
} from '@mantine/core'
import { useDebouncedValue, useFocusWithin, useIsFirstRender, useWindowEvent } from '@mantine/hooks'
import { usePreviousDistinct } from '@react-hookz/web'
import { IconSearch } from '@tabler/icons-react'
import { type ReactNode } from 'react'
import { isString, keys, only } from 'remeda'
import { useLikeC4Model } from '../../../likec4model/useLikeC4Model'
import * as css from './LikeC4Search.css'
import { moveFocusToSearchInput, setSearch, useIsPickViewActive, useSearch } from './state'

function startingWithKind(search: string) {
  return search.match(/^k(i(nd?)?)?$/) != null
}

const SEARCH_PREFIXES = ['#', 'kind:']

export function LikeC4SearchInput() {
  const isPickViewActive = useIsPickViewActive()
  const likec4model = useLikeC4Model(true)
  const combobox = useCombobox({
    scrollBehavior: 'smooth',
  })
  const { ref, focused } = useFocusWithin()
  const search = useSearch()
  const previous = usePreviousDistinct(search)
  const isFirstRender = useIsFirstRender()

  const [isEmptyForSomeTime] = useDebouncedValue(search === '' && !isFirstRender, isString(previous) ? 400 : 1000)

  useWindowEvent(
    'keydown',
    (event) => {
      try {
        if (!focused && !isPickViewActive && (event.key === 'Backspace' || event.key.match(/^\p{L}$/u))) {
          moveFocusToSearchInput()
        }
      } catch (e) {
        console.warn(e)
      }
    },
  )

  let options = [] as ReactNode[]
  let isExactMatch = false

  switch (true) {
    case search === '' && isEmptyForSomeTime: {
      options = SEARCH_PREFIXES.map((prefix) => (
        <ComboboxOption value={prefix} key={prefix}>
          <Text component="span" opacity={.5} mr={4} fz={'sm'}>Search by</Text>
          {prefix}
        </ComboboxOption>
      ))
      break
    }
    case search.startsWith('#'): {
      const searchTag = search.toLocaleLowerCase().slice(1)
      const alloptions = likec4model.allTags().filter((tag) => tag.toLocaleLowerCase().includes(searchTag)).sort(
        compareNatural,
      )
      isExactMatch = only(alloptions)?.toLocaleLowerCase() === searchTag
      options = alloptions.map((tag) => (
        <ComboboxOption value={`#${tag}`} key={tag}>
          <Text component="span" opacity={.5} mr={1} fz={'sm'}>#</Text>
          {tag}
        </ComboboxOption>
      ))
      break
    }
    case search.startsWith('kind:'):
    case startingWithKind(search): {
      const term = search.length > 5 ? search.slice(5).toLocaleLowerCase() : ''
      let alloptions = keys(likec4model.$model.specification.elements)
      if (term) {
        alloptions = alloptions.filter((kind) => kind.toLocaleLowerCase().includes(term))
        isExactMatch = only(alloptions)?.toLocaleLowerCase() === term
      }
      options = alloptions.map((kind) => (
        <ComboboxOption value={`kind:${kind}`} key={kind}>
          <Text component="span" opacity={.5} mr={1} fz={'sm'}>kind:</Text>
          {kind}
        </ComboboxOption>
      ))
      break
    }
  }

  return (
    <Combobox
      onOptionSubmit={(optionValue) => {
        setSearch(optionValue)
        combobox.resetSelectedOption()
        if (!['#', 'kind:'].includes(optionValue)) {
          combobox.closeDropdown()
          // Let react to display filtered elements
          setTimeout(() => {
            document.querySelector<HTMLButtonElement>(`.${css.root} .${css.focusable}`)?.focus()
          }, 50)
        }
      }}
      width={'max-content'}
      position="bottom-start"
      shadow="md"
      offset={{
        mainAxis: 4,
        crossAxis: 50,
      }}
      store={combobox}
      withinPortal={false}
    >
      <ComboboxTarget>
        <Input
          ref={ref}
          id="likec4searchinput"
          placeholder="Search by title, description or start with # or kind:"
          tabIndex={0}
          classNames={{
            input: css.input,
          }}
          size="xl"
          value={search}
          leftSection={<IconSearch style={{ width: rem(20) }} stroke={2} />}
          onChange={(event) => {
            setSearch(event.currentTarget.value)
            combobox.openDropdown()
            combobox.updateSelectedOptionIndex()
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => combobox.closeDropdown()}
          onKeyDownCapture={(e) => {
            if (e.key === 'Tab' && startingWithKind(search)) {
              setSearch('kind:')
              return stopAndPrevent(e)
            }
            if (e.key === 'Backspace' && combobox.dropdownOpened) {
              if (search === 'kind:') {
                setSearch('')
                combobox.resetSelectedOption()
                return stopAndPrevent(e)
              }
              if (search.startsWith('kind:') && isExactMatch) {
                setSearch('kind:')
                combobox.resetSelectedOption()
                return stopAndPrevent(e)
              }
              if (search.startsWith('#') && isExactMatch) {
                setSearch('#')
                combobox.resetSelectedOption()
                return stopAndPrevent(e)
              }
            }
            if (e.key === 'Escape' && combobox.dropdownOpened && options.length > 0) {
              stopAndPrevent(e)
              combobox.closeDropdown()
              return
            }
            if (
              e.key === 'ArrowDown' && (
                !combobox.dropdownOpened ||
                options.length === 0 || isExactMatch ||
                // reached the last option and the search is empty
                (search === '' && combobox.getSelectedOptionIndex() === options.length - 1)
              )
            ) {
              combobox.closeDropdown()
              stopAndPrevent(e)
              document.querySelector<HTMLButtonElement>(`.${css.root} .${css.focusable}`)?.focus()
              return
            }
          }} />
      </ComboboxTarget>

      <ComboboxDropdown hidden={options.length === 0} style={{ minWidth: 300 }}>
        <ComboboxOptions>
          <ScrollAreaAutosize mah={'min(322px, calc(100cqh - 50px))'} type="scroll">
            {options}
          </ScrollAreaAutosize>
        </ComboboxOptions>
      </ComboboxDropdown>
    </Combobox>
  )
}
function stopAndPrevent(e: React.KeyboardEvent) {
  e.stopPropagation()
  e.preventDefault()
  return
}
