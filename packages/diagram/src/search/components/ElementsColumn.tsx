import type { LikeC4Model } from '@likec4/core/model'
import type { Fqn } from '@likec4/core/types'
import {
  ifilter,
  isAncestor,
  nameFromFqn,
  sortParentsFirst,
} from '@likec4/core/utils'
import { cx, cx as clsx } from '@likec4/styles/css'
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
import * as m from 'motion/react-m'
import { type KeyboardEventHandler, memo, useEffect, useMemo } from 'react'
import { first, isEmpty, only, pipe, reduce } from 'remeda'
import { IconOrShapeRenderer } from '../../context/IconRenderer'
import { useDiagram } from '../../hooks/useDiagram'
import { sortByLabel } from '../../likec4model/useLikeC4ElementsTree'
import { useLikeC4Model } from '../../likec4model/useLikeC4Model'
import { useNormalizedSearch, useSearchActor } from '../hooks'
import { buttonsva } from './_shared.css'
import * as styles from './ElementsColumn.css'
import { centerY, moveFocusToSearchInput, queryAllFocusable, stopAndPrevent } from './utils'
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

const btn = buttonsva()

export const ElementsColumn = memo(() => {
  const model = useLikeC4Model()
  const search = useNormalizedSearch()
  const data = useMemo(() => {
    const searchTerms = search.split('.')
    let elements
    if (isEmpty(searchTerms) || searchTerms[0] === 'kind:') {
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
    const byid = {} as Record<Fqn, LikeC4ModelTreeNodeData>
    const { all, roots } = pipe(
      [...elements],
      sortParentsFirst,
      reduce((acc, element) => {
        const treeItem: LikeC4ModelTreeNodeData = {
          label: element.title,
          value: element.id,
          element,
          searchTerms,
          children: [],
        }
        byid[treeItem.value] = treeItem
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
      byid,
      roots: roots.sort(sortByLabel),
    }
  }, [model, search])

  const handleClick = useHandleElementSelection()

  if (data.all.length === 0) {
    return <NothingFound />
  }

  return <ElementsTree data={data} handleClick={handleClick} />
})

const setHoveredNode = () => {}

function ElementsTree({
  data: {
    all,
    byid,
    roots,
  },
  handleClick,
}: {
  data: {
    all: LikeC4ModelTreeNodeData[]
    byid: Record<Fqn, LikeC4ModelTreeNodeData>
    roots: LikeC4ModelTreeNodeData[]
  }
  handleClick: (element: LikeC4Model.Element) => void
}) {
  const tree = useTree({
    multiple: false,
  })
  tree.setHoveredNode = setHoveredNode

  useEffect(() => {
    tree.collapseAllNodes()
    for (const nd of all) {
      if (nd.children.length > 0) {
        tree.expand(nd.value)
      }
    }
  }, [all])

  const onKeyDownCapture: KeyboardEventHandler = useCallbackRef((e) => {
    const target = e.target as HTMLElement
    const id = target.getAttribute('data-value')
    const node = !!id && byid[id as Fqn]
    if (!node) return
    if (e.key === 'ArrowUp') {
      if (id === roots[0]?.value) {
        stopAndPrevent(e)
        moveFocusToSearchInput(target)
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
      const viewButtons = queryAllFocusable(target, 'views')
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
  })

  return (
    <Tree
      data-likec4-search-elements
      allowRangeSelection={false}
      clearSelectionOnOutsideClick
      selectOnClick={false}
      tree={tree}
      data={roots}
      levelOffset={'lg'}
      classNames={{
        root: styles.treeRoot,
        node: cx(styles.focusable, styles.treeNode),
        label: styles.treeLabel,
        subtree: styles.treeSubtree,
      }}
      onKeyDownCapture={onKeyDownCapture}
      renderNode={ElementTreeNode}
    />
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
    className: cx(btn.icon, styles.elementIcon),
  })
  const views = [...element.views()]

  const handleClick = useHandleElementSelection()

  const key = `@tree.${node.value}`

  return (
    <m.div layoutId={key} {...elementProps as any}>
      <ActionIcon
        variant="transparent"
        size={16}
        tabIndex={-1}
        className={clsx(styles.elementExpandIcon)}
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
        data-value={element.id}
        className={clsx(btn.root, 'group', 'likec4-element-button')}
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
          <Group gap={'xs'} wrap="nowrap" align="center" className={styles.elementTitleAndId}>
            <Highlight component="div" highlight={searchTerms} className={btn.title!}>
              {node.label as any}
            </Highlight>
            <Tooltip label={element.id} withinPortal={false} fz={'xs'} disabled={!element.id.includes('.')}>
              <Highlight
                component="div"
                highlight={searchTerms}
                className={cx(styles.elementId, btn.descriptionColor)}>
                {nameFromFqn(element.id)}
              </Highlight>
            </Tooltip>
          </Group>
          <Highlight component="div" highlight={searchTerms} className={btn.description!} lineClamp={1}>
            {element.description.text || 'No description'}
          </Highlight>
        </Box>

        <Text component="div" className={cx(styles.elementViewsCount, btn.descriptionColor)} fz={'xs'}>
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
  const diagram = useDiagram()
  const searchActorRef = useSearchActor()
  return useCallbackRef((element: LikeC4Model.Element) => {
    const views = [...element.views()]
    if (views.length === 0) {
      return
    }
    const singleView = only(views)
    if (singleView) {
      searchActorRef.send({ type: 'close' })
      if (singleView.id !== diagram.currentView.id) {
        setTimeout(() => {
          diagram.navigateTo(singleView.id)
        }, 100)
      }
      return
    }
    searchActorRef.send({ type: 'pickview.open', elementFqn: element.id })
  })
}
