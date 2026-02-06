import type { LikeC4Model } from '@likec4/core/model'
import type { Fqn, NonEmptyArray } from '@likec4/core/types'
import {
  ifilter,
  imap,
  isAncestor,
  nameFromFqn,
  stringHash,
  toArray,
} from '@likec4/core/utils'
import { cx, cx as clsx } from '@likec4/styles/css'
import { Txt } from '@likec4/styles/jsx'
import {
  type RenderTreeNodePayload,
  ActionIcon,
  Box,
  Group,
  Highlight,
  Tooltip,
  Tree,
  UnstyledButton,
  useTree,
} from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import { type KeyboardEventHandler, memo, useEffect, useMemo } from 'react'
import { filter, first, hasAtLeast, last, only, pipe, reduce } from 'remeda'
import { IconOrShapeRenderer } from '../../context/IconRenderer'
import { useCallbackRef } from '../../hooks/useCallbackRef'
import { useLikeC4Model } from '../../hooks/useLikeC4Model'
import { useNormalizedSearch, useSearchActor } from '../hooks'
import { buttonsva } from './_shared.css'
import * as styles from './ElementsColumn.css'
import { centerY, moveFocusToSearchInput, queryAllFocusable, stopAndPrevent } from './utils'
import { NothingFound } from './ViewsColum'

interface LikeC4ModelTreeNodeData {
  label: string
  value: Fqn
  element: LikeC4Model.Element
  viewsCount: number
  children: LikeC4ModelTreeNodeData[]
}

function useElementsColumnData() {
  const model = useLikeC4Model()

  // We will mutate this array to build the tree structure
  const allElements = useMemo(() =>
    pipe(
      model.elements(),
      ifilter(i => !i.imported),
      imap((element): LikeC4ModelTreeNodeData => ({
        label: element.title,
        value: element.id,
        element,
        // searchTerms,
        viewsCount: [...element.views()].length,
        children: [],
      })),
      toArray(),
    ), [model])

  const search = useNormalizedSearch()

  return useMemo(() => {
    const searchTerms = search.split('.')
    let elements
    if (search === '' || search === 'kind:') {
      elements = allElements
    } else if (search.startsWith('kind:')) {
      const searchKind = search.slice(5)
      elements = filter(allElements, ({ element }) => {
        return element.kind.toLocaleLowerCase()[searchKind.length > 4 ? 'startsWith' : 'includes'](searchKind)
      })
    } else if (search.startsWith('#')) {
      const searchTag = search.slice(1)
      elements = filter(allElements, ({ element }) => {
        return element.tags.some((tag) => tag.toLocaleLowerCase().includes(searchTag))
      })
    } else if (hasAtLeast(searchTerms, 2)) {
      const satisfies = (element: LikeC4Model.Element) => {
        const fqnParts = element.id.toLocaleLowerCase().split('.')
        if (fqnParts.length < searchTerms.length) {
          return false
        }
        let lastMatchIndex = 0
        for (let i = 0; i < fqnParts.length; i++) {
          if (fqnParts[i]!.includes(searchTerms[lastMatchIndex]!)) {
            lastMatchIndex++
            // All terms matched
            if (lastMatchIndex === searchTerms.length) {
              return true
            }
            continue
          }
        }
        return false
      }
      elements = filter(allElements, ({ element }) => satisfies(element))
    } else {
      elements = filter(allElements, ({ element }) => {
        const value = element.title + ' ' + element.name + ' ' + (element.summary.md || '')
        return value.toLocaleLowerCase().includes(search)
      })
    }

    const byid = {} as Record<Fqn, LikeC4ModelTreeNodeData>

    const { hash, all, roots } = pipe(
      elements,
      reduce((acc, treeItem) => {
        treeItem.children = []
        byid[treeItem.value] = treeItem
        const parent = acc.all.findLast((root) => isAncestor(root.value, treeItem.value))
        if (parent) {
          parent.children.push(treeItem)
        } else {
          acc.roots.push(treeItem)
        }
        acc.all.push(treeItem)
        acc.hash = stringHash(acc.hash + treeItem.value)
        return acc
      }, {
        hash: 'empty',
        all: [] as LikeC4ModelTreeNodeData[],
        roots: [] as LikeC4ModelTreeNodeData[],
      }),
    )
    return {
      hash,
      all,
      byid,
      roots,
      searchTerms: hasAtLeast(searchTerms, 1) ? searchTerms : [search] as NonEmptyArray<string>,
    }
  }, [allElements, search])
}
type ElementsColumnData = ReturnType<typeof useElementsColumnData>

const btn = buttonsva()

export const ElementsColumn = memo(() => {
  const data = useElementsColumnData()

  const handleClick = useHandleElementSelection()

  if (data.all.length === 0) {
    return <NothingFound />
  }

  return <ElementsTree data={data} handleClick={handleClick} />
})

const setHoveredNode = () => {}

function ElementsTree({
  data: {
    searchTerms,
    all,
    byid,
    hash,
    roots,
  },
  handleClick,
}: {
  data: ElementsColumnData
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
  }, [hash])

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
      renderNode={p => <ElementTreeNode {...p} searchTerms={searchTerms} handleClick={handleClick} />}
    />
  )
}

function ElementTreeNode(
  { node, elementProps, hasChildren, expanded, handleClick, searchTerms }: RenderTreeNodePayload & {
    searchTerms: NonEmptyArray<string>
    handleClick: (element: LikeC4Model.Element) => void
  },
) {
  const { label, element, viewsCount } = node as LikeC4ModelTreeNodeData
  const elementIcon = IconOrShapeRenderer({
    element: {
      id: element.id,
      title: element.title,
      shape: element.shape,
      icon: element.icon,
    },
    className: cx(btn.icon, styles.elementIcon),
  })
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
        {...viewsCount > 0 && {
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
              {label}
            </Highlight>
            <Tooltip label={element.id} withinPortal={false} fz={'xs'} disabled={!element.id.includes('.')}>
              <Highlight
                component="div"
                highlight={last(searchTerms)}
                className={cx(styles.elementId, btn.descriptionColor)}>
                {nameFromFqn(element.id)}
              </Highlight>
            </Tooltip>
          </Group>
          <Highlight
            component="div"
            highlight={element.summary.nonEmpty ? searchTerms : []}
            className={btn.description!}
            lineClamp={1}>
            {element.summary.nonEmpty ? element.summary.text : 'No description'}
          </Highlight>
        </Box>

        <Txt as={'div'} className={cx(styles.elementViewsCount, btn.descriptionColor)} size={'xs'}>
          {viewsCount === 0 ? 'No views' : (
            <>
              {viewsCount} view{viewsCount > 1 ? 's' : ''}
            </>
          )}
        </Txt>
      </UnstyledButton>
    </m.div>
  )
}

function useHandleElementSelection() {
  const searchActorRef = useSearchActor()

  return useCallbackRef((element: LikeC4Model.Element) => {
    const views = [...element.views()]
    if (views.length === 0) {
      return
    }
    const elementFqn = element.id
    const onlyOneViewId = only(views)?.id
    if (!onlyOneViewId) {
      searchActorRef.send({ type: 'pickview.open', elementFqn })
      return
    }
    searchActorRef.send({
      type: 'navigate.to',
      viewId: onlyOneViewId,
      focusOnElement: elementFqn,
    })
  })
}
