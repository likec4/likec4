import { css } from '@likec4/styles/css'
import { HStack } from '@likec4/styles/jsx'
import { Button } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useRef } from 'react'
import { ElementTag } from '../../base-primitives'
import { useLikeC4Model } from '../../hooks/useLikeC4Model'
import { useNormalizedSearch, useUpdateSearch } from '../hooks'
import { focusToFirstFoundElement, moveFocusToSearchInput } from './utils'

export function SearchByTags() {
  const ref = useRef<HTMLDivElement>(null)
  let tags = useLikeC4Model().tagsSortedByUsage
  let setSearch = useUpdateSearch()
  let search = useNormalizedSearch()
  let countBefore = tags.length
  if (search.startsWith('#')) {
    const searchTag = search.slice(1)
    tags = tags.filter(({ tag }) => tag.toLocaleLowerCase().includes(searchTag))
  }
  if (tags.length === 0) {
    return null
  }

  const isFiltered = tags.length !== countBefore

  return (
    <HStack
      ref={ref}
      css={{
        gap: 'md',
        paddingLeft: '[48px]',
        flexWrap: 'nowrap',
      }}
    >
      <HStack
        css={{
          gap: '1.5', // 6px
          flexWrap: 'wrap',
          opacity: isFiltered ? 1 : .3,
          grayscale: isFiltered ? 0 : .9,
          filter: 'auto',
          transition: 'fast',
          _groupHover: {
            opacity: 1,
            grayscale: 0,
          },
          _groupFocusWithin: {
            opacity: 1,
            grayscale: 0,
          },
        }}
      >
        {tags.map(({ tag }) => (
          // <Pill
          //   key={tag}
          //   data-likec4-tag={tag}
          //   className={cx(
          //     likec4tag(),
          //     css({
          //       minWidth: 'unset',
          //       cursor: 'pointer',
          //     }),
          //   )}
          //   onClick={(e) => {
          //     e.stopPropagation()
          //     setSearch(`#${tag}`)
          //   }}
          //   onRemove={() => {
          //     setSearch('#')
          //     moveFocusToSearchInput()
          //   }}
          //   withRemoveButton={tag === `${search.slice(1)}`}
          // >
          //   <span style={{ opacity: 0.7, fontSize: '1.05em' }}>#</span>
          //   {tag}
          // </Pill>
          <ElementTag
            key={tag}
            tag={tag}
            className={css({
              userSelect: 'none',
              cursor: 'pointer',
            })}
            onClick={(e) => {
              e.stopPropagation()
              setSearch(`#${tag}`)
              // Let react to display filtered elements
              setTimeout(() => {
                focusToFirstFoundElement(ref.current)
              }, 350)
            }}
          />
        ))}
      </HStack>
      {isFiltered && (
        <Button
          size="compact-xs"
          variant="light"
          onClick={(e) => {
            e.stopPropagation()
            setSearch('')
            moveFocusToSearchInput(ref.current)
          }}
          rightSection={<IconX size={14} />}
        >
          Clear
        </Button>
      )}
    </HStack>
  )
}
