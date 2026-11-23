// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { Fqn, NonEmptyArray } from '@likec4/core/types'
import {
  nameFromFqn,
} from '@likec4/core/utils'
import { css, cx, cx as clsx } from '@likec4/styles/css'
import { Box, Txt } from '@likec4/styles/jsx'
import { searchOverlay } from '@likec4/styles/recipes'
import {
  type RenderTreeNodePayload,
  ActionIcon,
  Highlight,
  Tooltip,
  Tree,
  useTree,
} from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import * as m from 'motion/react-m'
import { type KeyboardEventHandler, memo, useEffect } from 'react'
import { first, last, mapToObj } from 'remeda'
import { IconOrShapeRenderer } from '../../context/IconRenderer'
import { useCallbackRef } from '../../hooks/useCallbackRef'
import { useSearchContext } from '../SearchContext'
import * as styles from './ElementsColumn.css'
import { ElementTitleAndId } from './ElementsColumn.css'
import { type ElementsColumnData, type LikeC4ModelTreeNodeData, useElementsColumnData } from './useElementsColumnData'
import { centerY, moveFocusToSearchInput, queryAllFocusable, stopAndPrevent } from './utils'
import { NothingFound } from './ViewsColum'

const btn = searchOverlay()

export const ElementsColumn = memo(() => {
  const data = useElementsColumnData()

  const handleClick = useHandleElementSelection()

  if (data.treeData.length === 0) {
    return <NothingFound />
  }

  return <ElementsTree data={data} handleClick={handleClick} />
})

function ElementsTree({
  data: {
    searchTerms,
    treeData,
    lookup,
    expanded,
  },
  handleClick,
}: {
  data: ElementsColumnData
  handleClick: (element: LikeC4ModelTreeNodeData) => void
}) {
  const tree = useTree({
    multiple: false,
  })

  // Every search result re-applies its expansion, even with the same ancestors,
  // so a node collapsed manually in an earlier search does not hide current matches
  useEffect(() => {
    tree.collapseAllNodes()
    if (!expanded) {
      return
    }
    tree.setExpandedState(mapToObj(expanded, (id) => [id, true]))
  }, [treeData])

  const onKeyDownCapture: KeyboardEventHandler = useCallbackRef((e) => {
    const target = e.target as HTMLElement
    const id = target.getAttribute('data-value')
    const node = !!id && lookup(id as Fqn)
    if (!node) return
    if (e.key === 'ArrowUp') {
      if (id === treeData[0]?.value) {
        stopAndPrevent(e)
        moveFocusToSearchInput(target)
      }
      return
    }
    if (e.key === 'ArrowRight') {
      const hasChildren = node.children.length > 0
      if (hasChildren && tree.expandedState[id] !== true) {
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
      handleClick(node)
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
      data={treeData}
      levelOffset={'md'}
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
  { node: fromNode, elementProps, expanded, handleClick, searchTerms }: RenderTreeNodePayload & {
    searchTerms: NonEmptyArray<string>
    handleClick: (node: LikeC4ModelTreeNodeData) => void
  },
) {
  const node = fromNode as LikeC4ModelTreeNodeData
  const { label, element } = node
  const { viewsCount } = element
  const key = `@tree.${node.value}`

  return (
    <m.div layout="position" layoutId={key} {...elementProps as any}>
      <ElementExpandIcon expanded={expanded} hasChildren={node.hasChildren ?? false} />
      <m.button
        layout
        tabIndex={-1}
        data-value={element.id}
        className={clsx(btn.button, 'group', 'likec4-element-button')}
        {...viewsCount > 0 && {
          onClick: (e) => {
            if (!node.hasChildren || expanded) {
              e.stopPropagation()
              handleClick(node)
            }
          },
        }}
      >
        <IconOrShapeRenderer element={element} className={cx(btn.buttonIcon, styles.elementIcon)} />
        <Box style={{ flexGrow: 1 }}>
          <ElementTitleAndId>
            <ElementTitle highlight={searchTerms}>
              {label}
            </ElementTitle>
            <ElementId elementId={element.id} highlight={searchTerms} />
          </ElementTitleAndId>
          <Highlight
            component="div"
            highlight={searchTerms}
            className={btn.buttonDescription!}
            lineClamp={1}>
            {element.summary || 'No description'}
          </Highlight>
        </Box>
        <ElementViewCount viewsCount={viewsCount} />
      </m.button>
    </m.div>
  )
}

function useHandleElementSelection() {
  const ctx = useSearchContext()

  return useCallbackRef((node: LikeC4ModelTreeNodeData) => {
    if (node.element.navigateTo) {
      ctx.navigateTo(node.element.navigateTo, node.element.id)
      return
    }
    if (node.element.viewsCount > 0) {
      ctx.openPickView(node.element.id)
    }
  })
}

const ElementExpandIcon = ({ expanded, hasChildren }: { expanded: boolean; hasChildren: boolean }) => {
  return (
    <ActionIcon
      variant="transparent"
      size={20}
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
        }} />
    </ActionIcon>
  )
}

const ElementTitle = Highlight.withProps({
  component: 'div',
  className: btn.buttonTitle,
  lineClamp: 1,
  children: undefined as any,
  highlight: [] as string[],
})

const ElementId = ({ elementId, highlight }: { elementId: string; highlight: [string, ...string[]] }) => {
  return (
    <Tooltip label={elementId} withinPortal={false} fz={'xs'} disabled={!elementId.includes('.')}>
      <Highlight
        component="div"
        highlight={last(highlight)}
        className={cx(
          css({
            fontSize: 'xxs',
            lineHeight: 'sm',
            display: 'block',
            fontWeight: 'medium',
            whiteSpace: 'nowrap',
            padding: '[1px 5px]',
            borderRadius: 'sm',
            background: `mantine.dark[9]/30`,
            _light: {
              background: `mantine.gray[3]/20`,
            },
          }),
          btn.buttonMeta,
        )}>
        {nameFromFqn(elementId)}
      </Highlight>
    </Tooltip>
  )
}

const ElementViewCount = ({ viewsCount }: { viewsCount: number }) => {
  let label: string
  if (viewsCount === 0) {
    label = 'No views'
  } else {
    label = `${viewsCount} view${viewsCount > 1 ? 's' : ''}`
  }
  return (
    <Txt
      as={'div'}
      className={cx(
        css({
          flex: 'none',
          fontSize: 'xxs',
          fontWeight: 'medium',
          whiteSpace: 'nowrap',
          lineHeight: '[1.1]',
          [styles.whenContainerIsNarrow]: {
            display: 'none',
          },
        }),
        btn.buttonMeta,
      )}
      size={'xs'}>
      {label}
    </Txt>
  )
}
