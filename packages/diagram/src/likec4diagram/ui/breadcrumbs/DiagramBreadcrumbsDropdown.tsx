import { LikeC4ViewModel, normalizeViewPath, VIEW_FOLDERS_SEPARATOR } from '@likec4/core/model'
import { compareNaturalHierarchically, ifilter, ifirst, nonexhaustive, toArray } from '@likec4/core/utils'
import { css, cx } from '@likec4/styles/css'
import { HStack, VStack } from '@likec4/styles/jsx'
import { hstack, vstack } from '@likec4/styles/patterns'
import {
  Breadcrumbs,
  createScopedKeydownHandler,
  Divider,
  Highlight,
  PopoverDropdown,
  ScrollAreaAutosize,
  UnstyledButton,
} from '@mantine/core'
import { useThrottledCallback } from '@mantine/hooks'
import {
  IconChevronRight,
  IconFolderFilled,
  IconStack2,
  IconStarFilled,
  IconZoomScan,
} from '@tabler/icons-react'
import { useSelector } from '@xstate/react'
import type { ComponentPropsWithoutRef } from 'react'
import { isArray, pipe, sort } from 'remeda'
import { NavBtn } from '../../../components/NavBtn'
import { useLikeC4Model } from '../../../likec4model'
import type { BreadcrumbsActorSnapshot, DropdownColumnItem } from './actor'
import {
  useBreadcrumbsActorRef,
} from './ActorContext'
import { SearchInput } from './SearchInput'
import { breadcrumbTitle } from './styles.css'

const selector = (state: BreadcrumbsActorSnapshot) => ({
  columns: state.context.folderColumns,
  searchQuery: state.context.searchQuery,
})
type Selected = ReturnType<typeof selector>

const scopedKeydownHandler = createScopedKeydownHandler({
  siblingSelector: '[data-likec4-focusable]',
  parentSelector: '[data-likec4-breadcrumbs-dropdown]',
  activateOnFocus: false,
  loop: true,
  orientation: 'vertical',
})

export function DiagramBreadcrumbsDropdown() {
  const actor = useBreadcrumbsActorRef()
  const { columns, searchQuery } = useSelector(actor, selector)

  const setSearchQuery = useThrottledCallback((value: string) => {
    actor.send({ type: 'searchQuery.change', value })
  }, 250)

  const hasSearchQuery = searchQuery.trim().length >= 2

  return (
    <PopoverDropdown
      className={cx(
        'nowheel',
        vstack({
          layerStyle: 'likec4.dropdown',
          gap: 'xs',
        }),
      )}
      onMouseLeave={() => actor.send({ type: 'dropdown.mouseLeave' })}
      onMouseEnter={() => actor.send({ type: 'dropdown.mouseEnter' })}
    >
      <VStack data-likec4-breadcrumbs-dropdown>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          data-likec4-focusable
          onKeyDown={scopedKeydownHandler}
        />
        {hasSearchQuery
          ? <SearchResults searchQuery={normalizeViewPath(searchQuery).toLowerCase()} />
          : <FolderColumns columns={columns} />}
      </VStack>
    </PopoverDropdown>
  )
}

const compare = compareNaturalHierarchically(VIEW_FOLDERS_SEPARATOR)
function SearchResults({ searchQuery }: { searchQuery: string }) {
  const likec4model = useLikeC4Model()
  const actor = useBreadcrumbsActorRef()
  const isSearchByPath = searchQuery.includes(VIEW_FOLDERS_SEPARATOR)

  const found = pipe(
    likec4model.views(),
    ifilter(v => {
      // if search query contains folder separator, search in view data
      if (isSearchByPath && v.$view.title) {
        return normalizeViewPath(v.$view.title).toLowerCase().includes(searchQuery)
      }
      return v.id.toLowerCase().includes(searchQuery) || !!v.title?.toLowerCase().includes(searchQuery)
    }),
    ifirst(20),
    toArray(),
    sort((a, b) => compare(a.folder.path, b.folder.path)),
  )
  if (found.length === 0) return <div>no results</div>

  const highlight = isSearchByPath ? searchQuery.split(VIEW_FOLDERS_SEPARATOR) : searchQuery

  return (
    <DropdownScrollArea
      scrollbars="xy"
      offsetScrollbars={false}
      className={css({
        width: '100%',
        maxWidth: [
          '70vw',
          'calc(100cqw - 250px)',
        ],
        maxHeight: [
          '70vh',
          'calc(100cqh - 250px)',
        ],
      })}>
      <VStack gap={1}>
        {found.map(v => (
          <FoundedView
            key={v.id}
            view={v}
            highlight={highlight}
            onClick={e => {
              console.log('click')
              e.stopPropagation()
              actor.send({ type: 'select.view', viewId: v.id })
            }}
            data-likec4-focusable
            onKeyDown={scopedKeydownHandler}
          />
        ))}
      </VStack>
    </DropdownScrollArea>
  )
}
interface FoundedViewProps {
  view: LikeC4ViewModel
  highlight: string | string[]
}

const foundedViewClass = hstack({
  gap: '2xs',
  rounded: 'sm',
  px: 'xs',
  py: '2xs',
  _hover: {
    backgroundColor: {
      base: 'mantine.colors.gray[1]',
      _dark: 'mantine.colors.dark[5]',
    },
  },
  _focus: {
    outline: 'none',
    color: 'mantine.colors.primary.lightColor!',
    backgroundColor: 'mantine.colors.primary.lightHover!',
  },
})
const inheritColor = css({
  _groupFocus: {
    color: '[inherit!]',
    transition: 'none',
  },
})

function FoundedView(
  { view, highlight, ...props }: FoundedViewProps & Omit<ComponentPropsWithoutRef<'button'>, keyof FoundedViewProps>,
) {
  const folder = view.folder

  const viewIcon = ViewTypeIcon[view.id === 'index' ? 'index' : view._type]
  const viewLabel = (
    <Highlight
      key={view.id}
      component={'div'}
      className={cx(
        inheritColor,
        breadcrumbTitle({ truncate: true }),
      )}
      maw={350}
      highlight={highlight}
    >
      {view.title ?? view.id}
    </Highlight>
  )
  const className = cx(
    props.className,
    'group',
    foundedViewClass,
  )

  if (folder.isRoot) {
    return (
      <UnstyledButton
        {...props}
        className={className}
      >
        {viewIcon}
        {viewLabel}
      </UnstyledButton>
    )
  }

  const breadcrumbs = folder.breadcrumbs.map(b => (
    <Highlight
      key={b.path}
      component={'div'}
      className={cx(
        css({
          _groupHover: {
            color: 'mantine.colors.dimmed',
          },
        }),
        inheritColor,
        breadcrumbTitle({ dimmed: true, truncate: true }),
      )}
      maw={170}
      highlight={isArray(highlight) ? highlight : []}
    >
      {b.title}
    </Highlight>
  ))
  breadcrumbs.push(
    <HStack gap={4}>
      {viewIcon}
      {viewLabel}
    </HStack>,
  )

  return (
    <UnstyledButton
      {...props}
      className={className}
    >
      {folderIcon}
      <Breadcrumbs separator={<IconChevronRight size={12} stroke={1.5} />} separatorMargin={3}>
        {breadcrumbs}
      </Breadcrumbs>
    </UnstyledButton>
  )
}

const btnRightSection = <IconChevronRight size={12} stroke={1.5} className="mantine-rotate-rtl" />
const folderIcon = (
  <IconFolderFilled
    size={16}
    // stroke={1.5}
    className={css({
      opacity: {
        base: 0.3,
        _groupHover: 0.4,
        _groupActive: 0.7,
      },
    })} />
)

const viewTypeIconClass = css({
  opacity: {
    base: 0.3,
    _dark: 0.5,
    _groupHover: 0.7,
    _groupActive: 0.8,
  },
})
const ViewTypeIcon = {
  index: <IconStarFilled size={16} className={viewTypeIconClass} />,
  element: (
    <IconZoomScan
      size={18}
      stroke={2}
      className={viewTypeIconClass} />
  ),
  deployment: <IconStack2 size={16} stroke={1.5} className={viewTypeIconClass} />,
  dynamic: <IconStack2 size={16} stroke={1.5} className={viewTypeIconClass} />,
}

const DropdownScrollArea = ScrollAreaAutosize.withProps({
  scrollbars: 'y',
  offsetScrollbars: true,
  className: css({
    maxHeight: [
      '70vh',
      'calc(100cqh - 250px)',
    ],
  }),
})

function FolderColumns({ columns }: { columns: Selected['columns'] }) {
  return (
    <div className={hstack({ gap: '0', alignItems: 'flex-start', position: 'relative' })}>
      {columns.flatMap((column, i) => [
        i > 0 && <Divider orientation="vertical" mr={'xs'} key={'divider' + i} />,
        <FolderColumn key={'column' + i} items={column.items} />,
      ])}
    </div>
  )
}

function FolderColumn({ items }: {
  items: DropdownColumnItem[]
}) {
  const actor = useBreadcrumbsActorRef()
  const components = items.map((item) => {
    switch (item.type) {
      case 'folder':
        return (
          <NavBtn
            key={item.folderPath}
            variant="light"
            active={item.selected}
            label={item.title}
            leftSection={folderIcon}
            rightSection={btnRightSection}
            maw="300px"
            miw="200px"
            onClick={e => {
              e.stopPropagation()
              actor.send({ type: 'select.folder', folderPath: item.folderPath })
            }}
          />
        )
      case 'view':
        return (
          <NavBtn
            key={item.viewId}
            variant="filled"
            active={item.selected}
            label={item.title}
            description={item.description}
            leftSection={ViewTypeIcon[item.viewType]}
            maw="300px"
            miw="200px"
            onClick={e => {
              e.stopPropagation()
              if (item.selected) return
              actor.send({ type: 'select.view', viewId: item.viewId })
            }}
          />
        )
      default:
        nonexhaustive(item)
    }
  })

  return (
    <DropdownScrollArea>
      <VStack gap={1}>
        {components}
      </VStack>
    </DropdownScrollArea>
  )
}
