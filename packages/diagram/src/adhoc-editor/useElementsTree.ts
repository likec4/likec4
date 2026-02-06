import type { ElementModel, LikeC4Model } from '@likec4/core/model'
import type { ElementShape, Fqn } from '@likec4/core/types'
import { compareNaturalHierarchically, toArray } from '@likec4/core/utils'
import type { TreeCollection } from '@zag-js/collection'
import { normalizeProps, useMachine } from '@zag-js/react'
import * as tree from '@zag-js/tree-view'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { difference, hasAtLeast, sort } from 'remeda'
import { useId } from '../hooks/useId'
import { selectEditorPanelState, useEditorPanelState, useOnEditorPanelEvent } from './state/panel'
import type { ElementStates } from './state/utils'

export interface TreeNodeData {
  id: Fqn
  title: string
  icon?: string | undefined
  shape: ElementShape
  children: TreeNodeData[]
  state: 'include-explicit' | 'include-implicit' | 'exclude' | 'disabled' | 'not-present'
}

function getElementState(id: Fqn, states?: ElementStates): TreeNodeData['state'] {
  if (!states) {
    return 'not-present'
  }
  if (states.disabled.has(id)) {
    return 'disabled'
  }
  if (states.includedExplicit.has(id)) {
    return 'include-explicit'
  }
  if (states.includedImplicit.has(id)) {
    return 'include-implicit'
  }
  if (states.excluded.has(id)) {
    return 'exclude'
  }
  return 'not-present'
}

export interface ElementsTreeProps extends tree.Props<TreeNodeData> {}

function mapToTreeNodes(
  elements: Iterable<ElementModel>,
  states?: ElementStates,
): TreeNodeData[] {
  return toArray(elements).map(el => ({
    id: el.id,
    title: el.title,
    shape: el.shape,
    icon: el.icon ?? undefined,
    children: mapToTreeNodes(el.children(), states),
    state: getElementState(el.id, states),
  }))
}

export function createTreeCollection(
  model: LikeC4Model,
  states?: ElementStates,
): TreeCollection<TreeNodeData> {
  return tree.collection<TreeNodeData>({
    rootNode: {
      id: '@ROOT' as Fqn,
      title: '',
      shape: 'rectangle',
      icon: undefined,
      children: mapToTreeNodes(model.roots(), states),
      state: 'not-present',
    },
    nodeToValue(node) {
      return node.id
    },
    nodeToString(node) {
      return node.title
    },
    nodeToChildren(node) {
      return node.children
    },
    isNodeDisabled() {
      return false
    },
  })
}

export type TreeApi = tree.Api<any, TreeNodeData>

const select = selectEditorPanelState(
  s => ({
    searchInput: s.searchInput.length > 2 ? s.searchInput.toLowerCase() : '',
    collection: s.collection,
  }),
  (a, b) => a?.searchInput === b.searchInput && a?.collection.isEqual(b.collection),
)

export function useElementsTree(): TreeApi {
  const { searchInput, collection } = useEditorPanelState(select)
  const lowerCaseInput = useDeferredValue(searchInput)

  const filteredCollection = useMemo(() => {
    if (!lowerCaseInput) return collection
    return collection.filter(c => c.title.toLowerCase().includes(lowerCaseInput))
  }, [collection, lowerCaseInput])

  const [expandedValue, setExpandedValue] = useState([] as string[])

  // const filteredExpandedValue = useMemo(() => {
  //   if (filteredCollection === collection) {
  //     return
  //   }
  //   const branchValues = filteredCollection.getBranchValues()
  //   return expandedValue.filter(value => branchValues.includes(value))
  // }, [filteredCollection, expandedValue])

  // // const newBranches = filteredCollection !== collection
  // //   ? difference(filteredCollection.getBranchValues(), expandedValue).join(',')
  // //   : ''

  useEffect(() => {
    if (filteredCollection === collection) {
      return
    }
    setExpandedValue(current => {
      const newBranches = difference(filteredCollection.getBranchValues(), current)
      if (hasAtLeast(newBranches, 1)) {
        return sort([...current, ...newBranches], compareNaturalHierarchically())
      }
      return current
    })
  }, [filteredCollection])

  const service = useMachine(tree.machine as tree.Machine<TreeNodeData>, {
    id: useId(),
    collection: filteredCollection,
    defaultCheckedValue: [],
    defaultSelectedValue: [],
    expandedValue,
    onExpandedChange({ expandedValue }) {
      setExpandedValue(expandedValue)
    },
    // checkedValue,
    // defaultExpandedValue: [],
    // defaultFocusedValue: null,
    // onCheckedChange({ checkedValue }) {
    //   console.log({ checkedValue })
    // },
    onFocusChange(details) {
      console.log('Focus change', details)
    },
    onSelectionChange(details) {
      console.log('Selection change', details)
    },
    // expandOnClick,
    // onSelectionChange({ focusedValue, selectedNodes }) {
    //   console.log({ focusedValue, selectedNodes })
    //   if (selectedNodes.length === 0) {
    //     return
    //   }
    //   api.deselect(selectedNodes.map(n => n.id))
    // },
  })
  service.context.get('focusedValue')?.slice

  const api = tree.connect(service, normalizeProps)

  api.select

  useOnEditorPanelEvent('inputKeyDown', () => {
    const first = api.collection.getFirstNode()?.id
    if (first) {
      api.focus(first)
    }
  })

  return api
}
