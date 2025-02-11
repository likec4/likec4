import {
  type Fqn,
  ifilter,
  isAncestor,
  LikeC4Model,
  nameFromFqn,
  sortParentsFirst,
  toArray,
} from '@likec4/core'
import {
  type RenderTreeNodePayload,
  ActionIcon,
  Box,
  Group,
  Highlight,
  Text,
  Tooltip,
  Tree,
  UnstyledButton,
  useTree,
} from '@mantine/core'
import { useCallbackRef } from '@mantine/hooks'
import { IconChevronRight } from '@tabler/icons-react'
import clsx from 'clsx'
import { useEffect, useMemo } from 'react'
import { first, isEmpty, only, partition, pipe, reduce } from 'remeda'
import { IconOrShapeRenderer } from '../../../context/IconRenderer'
import { useCurrentViewId } from '../../../hooks/useCurrentViewId'
import { sortByLabel } from '../../../likec4model/useLikeC4ElementsTree'
import { useLikeC4Model } from '../../../likec4model/useLikeC4Model'
import * as css from './ElementsColumn.css'
import { moveFocusToSearchInput, setPickView, useCloseSearchAndNavigateTo, useNormalizedSearch } from './state'
import { NothingFound } from './ViewsColum'

interface LikeC4ModelTreeNodeData {
  label: string
  value: Fqn
  element: LikeC4Model.Element
  searchTerms: string[]
  children: LikeC4ModelTreeNodeData[]
}

function buildNode(
  element: LikeC4Model.Element,
  searchTerms: string[] = [],
): LikeC4ModelTreeNodeData {
  return {
    label: element.title,
    value: element.id,
    element,
    searchTerms,
    children: [...element.children()].map(e => buildNode(e, searchTerms)).sort(sortByLabel),
  }
}

export function centerY(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  const y = rect.y + Math.floor(rect.height / 2)
  return y
}

export function ElementsColumn() {
  const search = useNormalizedSearch()
  const model = useLikeC4Model(true)
  const data = useMemo((): LikeC4ModelTreeNodeData[] => {
    if (isEmpty(search) || search === 'kind:') {
      return [...model.roots()].map(e => buildNode(e)).sort(sortByLabel)
    }
    const searchTerms = search.split('.')
    const { roots } = pipe(
      model.elements(),
      ifilter(element => {
        if (search.startsWith('kind:')) {
          return element.kind.toLocaleLowerCase().startsWith(search.slice(5))
        }
        if (search.startsWith('#')) {
          return element.tags.some((tag) => tag.toLocaleLowerCase().includes(search.slice(1)))
        }
        return (element.title + ' ' + element.id + ' ' + (element.description ?? ''))
          .toLocaleLowerCase().includes(search)
      }),
      toArray(),
      sortParentsFirst,
      reduce((acc, element) => {
        const treeItem: LikeC4ModelTreeNodeData = acc.byid[element.id] = {
          label: element.title,
          value: element.id,
          element,
          searchTerms,
          children: [],
        }
        const parent = acc.roots.find((root) => isAncestor(root.value, treeItem.value))
        if (parent) {
          parent.children.push(treeItem)
          if (parent.children.length > 1) {
            parent.children.sort(sortByLabel)
          }
        } else {
          acc.roots.push(treeItem)
        }
        return acc
      }, {
        byid: {} as Record<Fqn, LikeC4ModelTreeNodeData>,
        roots: [] as LikeC4ModelTreeNodeData[],
      }),
    )
    return roots.sort(sortByLabel)
  }, [model, search])

  const tree = useTree({
    multiple: false,
  })
  useEffect(() => {
    if (isEmpty(data)) return
    tree.expandAllNodes()
  }, [data])

  const handleClick = useHandleElementSelection()

  return (
    <>
      {data.length === 0 && <NothingFound />}
      <Tree
        data-likec4-search-elements
        allowRangeSelection={false}
        clearSelectionOnOutsideClick
        selectOnClick={false}
        tree={tree}
        data={data}
        levelOffset={'lg'}
        classNames={{
          root: css.treeRoot,
          node: clsx(css.focusable, css.treeNode),
          label: css.treeLabel,
          subtree: css.treeSubtree,
        }}
        onKeyDownCapture={(e) => {
          const target = e.target as HTMLElement
          const id = target.getAttribute('data-value')
          if (!id) return
          if (e.key === 'ArrowUp') {
            if (id === first(data)?.value) {
              e.preventDefault()
              e.stopPropagation()
              moveFocusToSearchInput()
            }
            return
          }
          if (e.key === 'ArrowRight') {
            const hasChildren = model.children(id).size > 0
            if (hasChildren && !tree.expandedState[id]) {
              return
            }
            const label = (e.target as HTMLLIElement).querySelector<HTMLLIElement>('.mantine-Tree-label') ?? target
            const maxY = label.getBoundingClientRect().y
            const viewButtons = [...document.querySelectorAll<HTMLButtonElement>(
              `[data-likec4-search-views] .${css.focusable}`,
            )]
            let view = viewButtons.length > 1
              ? viewButtons.find((el, i, all) => centerY(el) > maxY || i === all.length - 1)
              : null
            view ??= first(viewButtons)
            if (view) {
              e.preventDefault()
              e.stopPropagation()
              view.focus()
            }
            return
          }
          if (e.key === ' ' || e.key === 'Enter') {
            e.stopPropagation()
            const element = model.element(id)
            handleClick(element)
            return
          }
        }}
        renderNode={ElementTreeNode}
      />
    </>
  )
}

function ElementTreeNode(
  { node, elementProps, hasChildren, expanded }: RenderTreeNodePayload,
) {
  const { element, searchTerms } = node as LikeC4ModelTreeNodeData
  const elementIcon = IconOrShapeRenderer({
    element: {
      id: element.id,
      title: element.title,
      shape: element.shape,
      icon: element.icon,
    },
    className: css.elementIcon,
  })
  const views = [...element.views()]

  const handleClick = useHandleElementSelection()

  return (
    <Box {...elementProps}>
      <ActionIcon
        variant="transparent"
        size={16}
        tabIndex={-1}
        className={clsx(css.elementExpandIcon)}
        style={{
          visibility: hasChildren ? 'visible' : 'hidden',
        }}>
        <IconChevronRight
          stroke={3.5}
          style={{
            transition: 'transform 150ms ease',
            transform: `rotate(${expanded ? '90deg' : '0'})`,
            width: '100%',
          }} />
      </ActionIcon>
      <UnstyledButton
        tabIndex={-1}
        className={clsx(css.elementButton, 'likec4-element-button')}
        {...views.length > 0 && {
          onClick: (e) => {
            if (!hasChildren || expanded) {
              e.stopPropagation()
              handleClick(element)
            }
          },
        }}
      >
        {elementIcon}
        <Box style={{ flexGrow: 1 }}>
          <Group gap={'xs'} wrap="nowrap" align="center" className={css.elementTitleAndId}>
            <Highlight component="div" highlight={searchTerms} className={css.elementTitle}>
              {node.label as any}
            </Highlight>
            <Tooltip label={element.id} withinPortal={false} fz={'xs'} disabled={!element.id.includes('.')}>
              <Highlight component="div" highlight={searchTerms} className={css.elementId}>
                {nameFromFqn(element.id)}
              </Highlight>
            </Tooltip>
          </Group>
          <Highlight component="div" highlight={searchTerms} className={css.elementDescription} lineClamp={1}>
            {element.description || 'No description'}
          </Highlight>
        </Box>

        <Text component="div" className={css.elementViewsCount}>
          {views.length === 0 ? 'No views' : (
            <>
              {views.length} view{views.length > 1 ? 's' : ''}
            </>
          )}
        </Text>
      </UnstyledButton>
    </Box>
  )
}

function useHandleElementSelection() {
  const navigateTo = useCloseSearchAndNavigateTo()

  return useCallbackRef((element: LikeC4Model.Element) => {
    const views = [...element.views()]
    if (views.length === 0) {
      return
    }
    const singleView = only(views)
    if (singleView) {
      navigateTo(singleView.id, element.id)
      return
    }
    const [scoped, others] = partition(views, v => v.viewOf?.id === element.id)
    setPickView({
      elementFqn: element.id,
      scoped,
      others,
    })
  })
}
