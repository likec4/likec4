import { type LikeC4ViewsFolder, LikeC4ViewModel, normalizeViewPath, VIEW_FOLDERS_SEPARATOR } from '@likec4/core/model'
import { compareNaturalHierarchically, ifilter, ifirst, nonexhaustive, toArray } from '@likec4/core/utils'
import { css, cx } from '@likec4/styles/css'
import { Box, HStack, VStack } from '@likec4/styles/jsx'
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
import { deepEqual } from 'fast-equals'
import type { ComponentPropsWithoutRef } from 'react'
import { isArray, pipe, sort } from 'remeda'
import { type NavigationLinkProps, NavigationLink } from '../components/NavigationLink'
import { useLikeC4Model } from '../likec4model/useLikeC4Model'
import type { NavigationPanelActorContext } from './actor'
import { useNavigationActorContext, useNavigationActorRef } from './hooks'
import { SearchInput } from './SearchInput'
import { breadcrumbTitle } from './styles.css'

const scopedKeydownHandler = createScopedKeydownHandler({
  siblingSelector: '[data-likec4-focusable]',
  parentSelector: '[data-likec4-breadcrumbs-dropdown]',
  activateOnFocus: false,
  loop: true,
  orientation: 'vertical',
})

export function NavigationPanelDropdown() {
  const actor = useNavigationActorRef()
  const searchQuery = useSelector(actor, s => s.context.searchQuery)

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
          gap: 'sm',
        }),
      )}
      data-likec4-breadcrumbs-dropdown
      onMouseLeave={() => actor.send({ type: 'dropdown.mouseLeave' })}
      onMouseEnter={() => actor.send({ type: 'dropdown.mouseEnter' })}
    >
      <HStack gap="xs">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          data-likec4-focusable
          onKeyDown={scopedKeydownHandler}
        />
        {
          /* <Button
          variant="default"
          size={'xs'}
          onClick={(e) => {
            e.stopPropagation()
            actor.send({ type: 'dropdown.dismiss' })
          }}
        >
          Close
        </Button> */
        }
      </HStack>
      <ScrollAreaAutosize
        scrollbars="xy"
        type="auto"
        offsetScrollbars="present"
        classNames={{
          root: css({
            maxWidth: [
              'calc(100vw - 20px)',
              'calc(100cqw - 20px)',
            ],
          }),
        }}
      >
        {hasSearchQuery
          ? <SearchResults searchQuery={normalizeViewPath(searchQuery).toLowerCase()} />
          : <FolderColumns />}
      </ScrollAreaAutosize>
    </PopoverDropdown>
  )
}

const compare = compareNaturalHierarchically(VIEW_FOLDERS_SEPARATOR)
function SearchResults({ searchQuery }: { searchQuery: string }) {
  const likec4model = useLikeC4Model()
  const actor = useNavigationActorRef()
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
    <ScrollAreaAutosize
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
    </ScrollAreaAutosize>
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
        _groupHover: 0.5,
        _groupActive: 0.5,
      },
    })} />
)

const viewTypeIconCss = css({
  opacity: {
    base: 0.3,
    _dark: 0.5,
    _groupHover: 0.7,
    _groupActive: 0.7,
  },
})
const ViewTypeIcon = {
  index: <IconStarFilled size={16} className={viewTypeIconCss} />,
  element: (
    <IconZoomScan
      size={18}
      stroke={2}
      className={viewTypeIconCss} />
  ),
  deployment: <IconStack2 size={16} stroke={1.5} className={viewTypeIconCss} />,
  dynamic: <IconStack2 size={16} stroke={1.5} className={viewTypeIconCss} />,
}

const ColumnScrollArea = ScrollAreaAutosize.withProps({
  scrollbars: 'y',
  className: css({
    maxHeight: [
      'calc(100vh - 50px)',
      'calc(100cqh - 50px)',
    ],
  }),
})

type ColumnItem =
  | {
    type: 'folder'
    folderPath: string
    title: string
    selected: boolean
  }
  | {
    type: 'view'
    viewType: 'element' | 'deployment' | 'dynamic' | 'index'
    viewId: string
    title: string
    description: string | null
    selected: boolean
  }
type FolderColumnData = {
  folderPath: string
  items: Array<ColumnItem>
}

function folderColumn(
  folder: LikeC4ViewsFolder,
  context: Pick<NavigationPanelActorContext, 'selectedFolder' | 'viewModel'>,
): FolderColumnData {
  return {
    folderPath: folder.path,
    items: [
      ...folder.folders.map(s => ({
        type: 'folder' as const,
        folderPath: s.path,
        title: s.title,
        selected: context.selectedFolder.startsWith(s.path),
      })),
      ...folder.views.map(s => ({
        type: 'view' as const,
        viewType: s.id === 'index' ? 'index' as const : s._type,
        viewId: s.id,
        title: s.title ?? s.id,
        description: s.description.nonEmpty && s.description.text || null,
        selected: s.id === context.viewModel.id,
      })),
    ],
  }
}

const selectColumns = (context: NavigationPanelActorContext): FolderColumnData[] => {
  const viewModel = context.viewModel
  const likec4model = viewModel.$model
  const columns = [
    folderColumn(likec4model.rootViewFolder, context),
  ]
  const folder = likec4model.viewFolder(context.selectedFolder)
  if (!folder.isRoot) {
    for (const b of folder.breadcrumbs) {
      columns.push(folderColumn(b, context))
    }
  }
  return columns
}

function FolderColumns() {
  const columns = useNavigationActorContext(selectColumns, deepEqual)
  return (
    <HStack gap="xs" alignItems="stretch">
      {columns.flatMap((column, i) => [
        i > 0 && <Divider orientation="vertical" key={'divider' + i} />,
        <FolderColumn key={column.folderPath} data={column} />,
      ])}
    </HStack>
  )
}

function FolderColumn({ data }: { data: FolderColumnData }) {
  const actor = useNavigationActorRef()
  return (
    <Box pb={'4'}>
      <ColumnScrollArea>
        <VStack gap={1}>
          {data.items.map((item, i) => (
            <FolderColumnItem
              key={`${data.folderPath}/${item.type}/${i}`}
              columnItem={item}
              onClick={e => {
                e.stopPropagation()
                if (item.type === 'folder') {
                  actor.send({ type: 'select.folder', folderPath: item.folderPath })
                } else {
                  actor.send({ type: 'select.view', viewId: item.viewId })
                }
              }}
            />
          ))}
        </VStack>
      </ColumnScrollArea>
    </Box>
  )
}

function FolderColumnItem({ columnItem, ...props }: { columnItem: ColumnItem } & NavigationLinkProps) {
  switch (columnItem.type) {
    case 'folder':
      return (
        <NavigationLink
          key={columnItem.folderPath}
          variant="light"
          active={columnItem.selected}
          label={columnItem.title}
          leftSection={folderIcon}
          rightSection={btnRightSection}
          maw="300px"
          miw="200px"
          {...props}
        />
      )
    case 'view':
      return (
        <NavigationLink
          key={columnItem.viewId}
          variant="filled"
          active={columnItem.selected}
          label={columnItem.title}
          description={columnItem.description}
          leftSection={ViewTypeIcon[columnItem.viewType]}
          maw="300px"
          miw="200px"
          {...props}
        />
      )
    default:
      nonexhaustive(columnItem)
  }
}
