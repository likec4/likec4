import {
  type Fqn,
  type LikeC4Model,
  ifilter,
  isAncestor,
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
import { m } from 'framer-motion'
import { useEffect, useMemo } from 'react'
import { first, indexBy, isEmpty, only, partition, pipe, prop, reduce } from 'remeda'
import { IconOrShapeRenderer } from '../../../context/IconRenderer'
import { sortByLabel } from '../../../likec4model/useLikeC4ElementsTree'
import { useLikeC4Model } from '../../../likec4model/useLikeC4Model'
import * as css from './ElementsColumn.css'
import { setPickView, useCloseSearchAndNavigateTo, useNormalizedSearch } from './state'
import { centerY, moveFocusToSearchInput, stopAndPrevent } from './utils'
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

export function ElementsColumn() {
  const search = useNormalizedSearch()
  const model = useLikeC4Model(true)
  const {
    all,
    byid,
    roots: data,
  } = useMemo(() => {
    const searchTerms = search.split('.')
    let elements
    if (isEmpty(search) || search === 'kind:') {
      elements = model.elements()
    } else {
      elements = ifilter(model.elements(), element => {
        if (search.startsWith('kind:')) {
          return element.kind.toLocaleLowerCase().startsWith(search.slice(5))
        }
        if (search.startsWith('#')) {
          return element.tags.some((tag) => tag.toLocaleLowerCase().includes(search.slice(1)))
        }
        return (element.title + ' ' + element.id + ' ' + (element.description ?? ''))
          .toLocaleLowerCase().includes(search)
      })
    }
    const { all, roots } = pipe(
      elements,
      toArray(),
      sortParentsFirst,
      reduce((acc, element) => {
        const treeItem: LikeC4ModelTreeNodeData = {
          label: element.title,
          value: element.id,
          element,
          searchTerms,
          children: [],
        }
        const parent = acc.all.findLast((root) => isAncestor(root.value, treeItem.value))
        if (parent) {
          parent.children.push(treeItem)
          if (parent.children.length > 1) {
            parent.children.sort(sortByLabel)
          }
        } else {
          acc.roots.push(treeItem)
        }
        acc.all.push(treeItem)
        return acc
      }, {
        all: [] as LikeC4ModelTreeNodeData[],
        roots: [] as LikeC4ModelTreeNodeData[],
      }),
    )
    return {
      all,
      byid: indexBy(all, prop('value')),
      roots: roots.sort(sortByLabel),
    }
  }, [model, search])

  const tree = useTree({
    multiple: false,
  })
  useEffect(() => {
    tree.collapseAllNodes()
    for (const nd of all) {
      if (nd.children.length > 0) {
        tree.expand(nd.value)
      }
    }
  }, [all])

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
          const node = !!id && byid[id as Fqn]
          if (!node) return
          if (e.key === 'ArrowUp') {
            if (id === data[0]?.value) {
              stopAndPrevent(e)
              moveFocusToSearchInput()
            }
            return
          }
          if (e.key === 'ArrowRight') {
            const hasChildren = node.children.length > 0
            if (hasChildren && tree.expandedState[id] === false) {
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
              stopAndPrevent(e)
              view.focus()
            }
            return
          }
          if (e.key === ' ' || e.key === 'Enter') {
            stopAndPrevent(e)
            handleClick(node.element)
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

  const key = `@tree.${node.value}`

  return (
    <m.div layoutId={key} key={key} {...elementProps as any}>
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
        component={m.button}
        layout
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
    </m.div>
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
