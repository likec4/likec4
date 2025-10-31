import { type LikeC4ViewsFolder, LikeC4ViewModel, normalizeViewPath, VIEW_FOLDERS_SEPARATOR } from '@likec4/core/model'
import type { ViewId } from '@likec4/core/types'
import { compareNaturalHierarchically, ifilter, ifirst, nonexhaustive, toArray } from '@likec4/core/utils'
import { css, cx } from '@likec4/styles/css'
import { Box, HStack, VStack } from '@likec4/styles/jsx'
import { hstack, vstack } from '@likec4/styles/patterns'
import {
  Breadcrumbs,
  Button,
  createScopedKeydownHandler,
  Divider,
  Highlight,
  Input,
  PopoverDropdown,
  rem,
  ScrollAreaAutosize,
  UnstyledButton,
} from '@mantine/core'
import { useThrottledCallback, useUncontrolled } from '@mantine/hooks'
import { useMountEffect } from '@react-hookz/web'
import {
  IconChevronRight,
  IconDirectionSignFilled,
  IconFolderFilled,
  IconSearch,
  IconStack2,
  IconStarFilled,
  IconZoomScan,
} from '@tabler/icons-react'
import { useSelector } from '@xstate/react'
import { deepEqual, shallowEqual } from 'fast-equals'
import {
  type ComponentPropsWithoutRef,
  type KeyboardEventHandler,
  memo,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from 'react'
import { isArray, isEmpty, pipe, sort } from 'remeda'
import { type NavigationLinkProps, NavigationLink } from '../components/NavigationLink'
import { useOnDiagramEvent } from '../custom'
import { useLikeC4Model } from '../hooks/useLikeC4Model'
import type { NavigationPanelActorContext, NavigationPanelActorSnapshot } from './actor'
import { ProjectsMenu } from './dropdown/ProjectsMenu'
import {
  useNavigationActor,
  useNavigationActorContext,
  useNavigationActorRef,
  useNavigationActorSnapshot,
} from './hooks'
import { breadcrumbTitle } from './styles.css'

const scopedKeydownHandler = createScopedKeydownHandler({
  siblingSelector: '[data-likec4-focusable]',
  parentSelector: '[data-likec4-breadcrumbs-dropdown]',
  activateOnFocus: false,
  loop: true,
  orientation: 'vertical',
})

function hasSearchQuerySelector(s: NavigationPanelActorSnapshot) {
  return s.context.searchQuery.trim().length >= 2
}

export function NavigationPanelDropdown() {
  const actor = useNavigationActor()
  const hasSearchQuery = useNavigationActorSnapshot(hasSearchQuerySelector)

  useOnDiagramEvent('paneClick', () => {
    actor.closeDropdown()
  })

  useOnDiagramEvent('nodeClick', () => {
    actor.closeDropdown()
  })

  const setSearchQuery = useThrottledCallback((value: string) => {
    actor.send({ type: 'searchQuery.change', value })
  }, 250)

  return (
    <PopoverDropdown
      className={cx(
        'nowheel',
        vstack({
          layerStyle: 'likec4.dropdown',
          gap: 'xs',
          pointerEvents: 'all',
        }),
      )}
      data-likec4-breadcrumbs-dropdown
      onMouseLeave={() => actor.send({ type: 'dropdown.mouseLeave' })}
      onMouseEnter={() => actor.send({ type: 'dropdown.mouseEnter' })}
    >
      <ProjectsMenu />
      <HStack gap="xs">
        <SearchInput
          defaultValue={actor.actorRef.getSnapshot().context.searchQuery}
          onChange={setSearchQuery}
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
        scrollbars="x"
        type="auto"
        offsetScrollbars="present"
        classNames={{
          root: css({
            maxWidth: [
              'calc(100vw - 50px)',
              'calc(100cqw - 50px)',
            ],
          }),
        }}
        styles={{
          viewport: {
            overscrollBehavior: 'none',
          },
        }}
      >
        {hasSearchQuery
          ? <SearchResults />
          : <FolderColumns />}
      </ScrollAreaAutosize>
    </PopoverDropdown>
  )
}

function selectSearchQuery(s: NavigationPanelActorSnapshot) {
  return normalizeViewPath(s.context.searchQuery)
}

const compare = compareNaturalHierarchically(VIEW_FOLDERS_SEPARATOR)

const SearchResults = memo(() => {
  const likec4model = useLikeC4Model()
  const actor = useNavigationActor()
  const searchQuery = useSelector(actor.actorRef, selectSearchQuery)
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const isSearchByPath = deferredSearchQuery.includes(VIEW_FOLDERS_SEPARATOR)
  const highlight = isSearchByPath ? deferredSearchQuery.split(VIEW_FOLDERS_SEPARATOR) : deferredSearchQuery

  const [found, setFound] = useState<LikeC4ViewModel[]>([])

  useEffect(() => {
    setFound(current => {
      const results = pipe(
        likec4model.views(),
        ifilter(v => {
          // if search query contains folder separator, search in view data
          if (isSearchByPath && v.$view.title) {
            return normalizeViewPath(v.$view.title).toLowerCase().includes(deferredSearchQuery)
          }
          return v.id.toLowerCase().includes(deferredSearchQuery) ||
            !!v.title?.toLowerCase().includes(deferredSearchQuery)
        }),
        ifirst(20),
        toArray(),
        sort((a, b) => compare(a.folder.path, b.folder.path)),
      )
      return shallowEqual(results, current) ? current : results
    })
  }, [likec4model, deferredSearchQuery, isSearchByPath])

  if (found.length === 0) return <div>no results</div>

  return (
    <ScrollAreaAutosize
      scrollbars="xy"
      offsetScrollbars={false}
      className={css({
        width: '100%',
        maxWidth: [
          'calc(100vw - 250px)',
          'calc(100cqw - 250px)',
        ],
        maxHeight: [
          'calc(100vh - 200px)',
          'calc(100cqh - 200px)',
        ],
      })}>
      <VStack gap="0.5">
        {found.map(v => (
          <FoundedView
            key={v.id}
            view={v}
            highlight={highlight}
            onClick={e => {
              e.stopPropagation()
              actor.selectView(v.id)
            }}
            data-likec4-focusable
            onKeyDown={scopedKeydownHandler}
          />
        ))}
      </VStack>
    </ScrollAreaAutosize>
  )
})

interface FoundedViewProps {
  view: LikeC4ViewModel
  highlight: string | string[]
}

const foundedViewClass = hstack({
  gap: 'xxs',
  rounded: 'sm',
  px: 'xs',
  py: 'xxs',
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
        css({
          '& > mark': {
            backgroundColor: {
              base: 'mantine.colors.yellow[2]/90',
              _dark: 'mantine.colors.yellow[5]/80',
              _groupFocus: '[transparent]',
            },
            color: {
              _groupFocus: '[inherit!]',
            },
          },
        }),
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
    <HStack gap="[4px]">
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
        _groupFocus: 0.5,
      },
    })} />
)

const viewTypeIconCss = css({
  opacity: {
    base: 0.3,
    _dark: 0.5,
    _groupHover: 0.8,
    _groupActive: 0.8,
    _groupFocus: 0.8,
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
  dynamic: <IconDirectionSignFilled size={18} className={viewTypeIconCss} />,
}

const ColumnScrollArea = ScrollAreaAutosize.withProps({
  scrollbars: 'y',
  className: css({
    maxHeight: [
      'calc(100vh - 160px)',
      'calc(100cqh - 160px)',
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
    viewId: ViewId
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
        selected: s.id === context.viewModel?.id,
      })),
    ],
  }
}

const selectColumns = (context: NavigationPanelActorContext): FolderColumnData[] => {
  const viewModel = context.viewModel
  if (!viewModel) {
    return []
  }
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

const FolderColumns = memo(() => {
  const columns = useNavigationActorContext(selectColumns, deepEqual)
  return (
    <HStack gap="xs" alignItems="stretch">
      {columns.flatMap((column, i) => [
        i > 0 && <Divider orientation="vertical" key={'divider' + i} />,
        <FolderColumn
          key={column.folderPath}
          data={column}
          isLast={i == columns.length - 1}
        />,
      ])}
    </HStack>
  )
})

function FolderColumn({ data, isLast }: { data: FolderColumnData; isLast: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const actor = useNavigationActorRef()

  const onItemClicked = (item: ColumnItem) => (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.type === 'folder') {
      actor.send({ type: 'select.folder', folderPath: item.folderPath })
    } else {
      actor.send({ type: 'select.view', viewId: item.viewId })
    }
  }

  useMountEffect(() => {
    if (isLast && ref.current) {
      ref.current.scrollIntoView({
        inline: 'nearest',
        behavior: 'smooth',
      })
    }
  })

  return (
    <Box mb={'1'} ref={ref}>
      <ColumnScrollArea>
        <VStack gap="0.5">
          {data.items.map((item, i) => (
            <FolderColumnItem
              key={`${data.folderPath}/${item.type}/${i}`}
              columnItem={item}
              onClick={onItemClicked(item)}
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

function SearchInput({ onKeyDown, ...props }: {
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onKeyDown?: KeyboardEventHandler<HTMLElement>
}) {
  const [_value, handleChange] = useUncontrolled({
    ...props,
    finalValue: '',
  })
  return (
    <Input
      size="xs"
      placeholder="Search by title or id"
      variant="unstyled"
      height={rem(26)}
      value={_value}
      onKeyDown={onKeyDown}
      onChange={e => handleChange(e.currentTarget.value)}
      data-likec4-focusable
      classNames={{
        wrapper: css({
          flexGrow: 1,
          backgroundColor: {
            base: 'mantine.colors.gray[1]',
            _dark: 'mantine.colors.dark[5]/80',
            _hover: {
              base: 'mantine.colors.gray[2]',
              _dark: 'mantine.colors.dark[4]',
            },
            _focus: {
              base: 'mantine.colors.gray[2]',
              _dark: 'mantine.colors.dark[4]',
            },
          },
          rounded: 'sm',
        }),
        input: css({
          _placeholder: {
            color: 'mantine.colors.dimmed',
          },
          _focus: {
            outline: 'none',
          },
        }),
      }}
      style={{
        ['--input-fz']: 'var(--mantine-font-size-sm)',
      }}
      leftSection={<IconSearch size={14} />}
      rightSectionPointerEvents="all"
      rightSectionWidth={'min-content'}
      rightSection={!props.value || isEmpty(props.value)
        ? null
        : (
          <Button
            variant="subtle"
            h="100%"
            size={'compact-xs'}
            color="gray"
            onClick={(e) => {
              e.stopPropagation()
              handleChange('')
            }}
          >
            clear
          </Button>
        )}
    />
  )
}
