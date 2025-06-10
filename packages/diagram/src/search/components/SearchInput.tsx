import {
  Combobox,
  ComboboxDropdown,
  ComboboxEmpty,
  ComboboxOption,
  ComboboxOptions,
  ComboboxTarget,
  Input,
  rem,
  ScrollAreaAutosize,
  Text,
  useCombobox,
} from '@mantine/core'
import { useFocusWithin, useWindowEvent } from '@mantine/hooks'
import { usePreviousDistinct } from '@react-hookz/web'
import { IconSearch } from '@tabler/icons-react'
import { type ReactNode, memo } from 'react'
import { keys, only } from 'remeda'
import { useLikeC4Model } from '../../likec4model/useLikeC4Model'
import { useSearch, useSearchActor } from '../hooks'
import * as css from './styles.css'
import { focusToFirstFoundElement, moveFocusToSearchInput, stopAndPrevent } from './utils'

function startingWithKind(search: string) {
  return search.match(/^(k|ki|kin|kind|kind:)$/) != null
}

const SEARCH_PREFIXES = ['#', 'kind:']

export const LikeC4SearchInput = memo(() => {
  const searchActorRef = useSearchActor()
  const likec4model = useLikeC4Model()
  const { ref, focused } = useFocusWithin<HTMLInputElement>()
  const [search, setSearch] = useSearch()
  const previous = usePreviousDistinct(search)

  // const [isEmptyForSomeTime, cancel] = useDebouncedValue(
  //   focused ? search : 'rstrs',
  //   2000,
  // )
  // // useF
  // // const isEmptyForSomeTime = debouncedSearch === ''
  // useEffect(() => {
  //   // cancel()
  // }, [])

  const combobox = useCombobox({
    scrollBehavior: 'smooth',
    loop: false,
  })

  useWindowEvent(
    'keydown',
    (event) => {
      try {
        if (
          !focused && (
            event.key === 'Backspace' ||
            event.key.startsWith('Arrow') ||
            event.key.match(/^\p{L}$/u)
          )
        ) {
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
    // case search === '' && isEmptyForSomeTime === '': {
    //   options = SEARCH_PREFIXES.map((prefix) => (
    //     <ComboboxOption value={prefix} key={prefix}>
    //       <Text component="span" opacity={.5} mr={4} fz={'sm'}>Search by</Text>
    //       {prefix}
    //     </ComboboxOption>
    //   ))
    //   break
    // }
    case search.startsWith('#'): {
      const searchTag = search.toLocaleLowerCase().slice(1)
      const alloptions = likec4model.tags.filter((tag) => tag.toLocaleLowerCase().includes(searchTag))
      isExactMatch = only(alloptions)?.toLocaleLowerCase() === searchTag
      if (alloptions.length === 0) {
        options = [
          <ComboboxEmpty key="empty-tags">
            No tags found
          </ComboboxEmpty>,
        ]
      } else {
        options = alloptions.map((tag) => (
          <ComboboxOption value={`#${tag}`} key={tag}>
            <Text component="span" opacity={.5} mr={1} fz={'sm'}>#</Text>
            {tag}
          </ComboboxOption>
        ))
      }
      break
    }
    case search.startsWith('kind:'):
    case startingWithKind(search): {
      const term = search.length > 5 ? search.slice(5).toLocaleLowerCase() : ''
      let alloptions = keys(likec4model.specification.elements)
      if (term) {
        alloptions = alloptions.filter((kind) => kind.toLocaleLowerCase().includes(term))
        isExactMatch = only(alloptions)?.toLocaleLowerCase() === term
      }
      if (alloptions.length === 0) {
        options = [
          <ComboboxEmpty key="empty-kinds">
            No kinds found
          </ComboboxEmpty>,
        ]
      } else {
        options = alloptions.map((kind) => (
          <ComboboxOption value={`kind:${kind}`} key={kind}>
            <Text component="span" opacity={.5} mr={1} fz={'sm'}>kind:</Text>
            {kind}
          </ComboboxOption>
        ))
      }
      break
    }
  }

  return (
    <Combobox
      onOptionSubmit={(optionValue) => {
        setSearch(optionValue)
        combobox.resetSelectedOption()
        if (!SEARCH_PREFIXES.includes(optionValue)) {
          combobox.closeDropdown()
          // Let react to display filtered elements
          setTimeout(() => {
            focusToFirstFoundElement()
          }, 350)
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
          autoFocus
          tabIndex={0}
          classNames={{
            input: css.input,
          }}
          size="lg"
          value={search}
          leftSection={<IconSearch style={{ width: rem(20) }} stroke={2} />}
          rightSection={
            <Input.ClearButton
              onClick={(e) => {
                e.stopPropagation()
                const openedWithSearch = searchActorRef.getSnapshot().context.openedWithSearch
                if (search === '' || search === openedWithSearch) {
                  searchActorRef.send({ type: 'close' })
                } else {
                  setSearch('')
                }
              }} />
          }
          rightSectionPointerEvents="auto"
          onChange={(event) => {
            setSearch(event.currentTarget.value)
            combobox.openDropdown()
            combobox.updateSelectedOptionIndex()
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => combobox.closeDropdown()}
          onKeyDownCapture={(e) => {
            if (e.key === 'Tab') {
              switch (true) {
                case combobox.getSelectedOptionIndex() >= 0: {
                  combobox.clickSelectedOption()
                  return stopAndPrevent(e)
                }
                case options.length === 1: {
                  const firstOption = combobox.selectFirstOption()
                  if (firstOption) {
                    combobox.clickSelectedOption()
                  }
                  return stopAndPrevent(e)
                }
                case startingWithKind(search): {
                  setSearch('kind:')
                  return stopAndPrevent(e)
                }
              }
              return
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
              e.key === 'ArrowUp' && combobox.dropdownOpened && search === '' && combobox.getSelectedOptionIndex() === 0
            ) {
              combobox.closeDropdown()
              stopAndPrevent(e)
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
              focusToFirstFoundElement()
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
})
