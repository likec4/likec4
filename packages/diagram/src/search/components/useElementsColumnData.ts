// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { LikeC4Model } from '@likec4/core/model'
import type { ElementShape, Fqn, NonEmptyArray, ViewId } from '@likec4/core/types'
import {
  ifilter,
  ihead,
  imap,
  toArray,
} from '@likec4/core/utils'
import type { TreeNodeData } from '@mantine/core'
import { useMemo } from 'react'
import { filter, hasAtLeast, pipe } from 'remeda'
import { useLikeC4Model } from '../../hooks/useLikeC4Model'
import { createFuzzySearch } from '../fuzzy'
import { useNormalizedSearch } from '../hooks'
import { matchesMetadataSearch, METADATA_SEARCH_PREFIX } from '../metadata-search'

export interface LikeC4ModelTreeNodeData extends TreeNodeData {
  label: string
  value: Fqn
  element: {
    id: Fqn
    parent: Fqn | null
    name: string
    kind: string
    icon: string | null
    shape: ElementShape
    title: string
    summary: string
    tags: string[]
    viewsCount: number
    navigateTo: ViewId | null
    metadata: LikeC4Model.Element['metadata']
  }
  children: LikeC4ModelTreeNodeData[]
  hasChildren: boolean
}

function dfs(model: LikeC4Model) {
  const allNodes: LikeC4ModelTreeNodeData[] = []
  const index = new Map<Fqn, LikeC4ModelTreeNodeData>()
  function buildNode(element: LikeC4Model.Element): LikeC4ModelTreeNodeData {
    const nd: LikeC4ModelTreeNodeData = {
      label: element.title || element.id,
      value: element.id,
      element: {
        id: element.id,
        parent: element.parent?.id ?? null,
        name: element.name,
        kind: element.kind,
        icon: element.icon,
        shape: element.shape,
        title: element.title,
        summary: element.summary.nonEmpty ? element.summary.text : '',
        tags: [...element.tags],
        viewsCount: element.views().size,
        navigateTo: element.views().size === 1 ? (ihead(element.views())?.id ?? null) : null,
        metadata: structuredClone(element.metadata),
      },
      children: [],
      hasChildren: false,
    }
    index.set(element.id, nd)
    allNodes.push(nd)

    const children = pipe(
      element.children(),
      ifilter(i => !i.imported),
      imap(buildNode),
      toArray(),
    )
    nd.children = children
    nd.hasChildren = children.length > 0

    return nd
  }

  const treeData = pipe(
    model.roots(),
    ifilter(i => !i.imported),
    imap(buildNode),
    toArray(),
  )

  const lookup = (id: Fqn) => index.get(id)!

  return {
    treeData,
    allNodes,
    lookup,
    /**
     * Filter the tree data to only include the visible elements (and their parents)
     * @param visibleElements - The visible elements
     * @returns The filtered tree data and lookup function
     */
    filterTree: (visibleElements: LikeC4ModelTreeNodeData[]) => {
      if (visibleElements.length === 0) {
        return { treeData: [], lookup, expanded: null }
      }
      if (visibleElements === allNodes) {
        // unfiltered tree opens every node with children
        return {
          treeData,
          lookup,
          expanded: allNodes.filter(node => node.children.length > 0).map(node => node.element.id),
        }
      }
      const parents = new Set<Fqn>()
      const newTree = new Map<Fqn, LikeC4ModelTreeNodeData>()
      const roots: LikeC4ModelTreeNodeData[] = []
      function buildNode(node: LikeC4ModelTreeNodeData): LikeC4ModelTreeNodeData {
        if (newTree.has(node.element.id)) {
          return newTree.get(node.element.id)!
        }
        const nd: LikeC4ModelTreeNodeData = {
          ...node,
          children: [],
          hasChildren: false,
        }
        const parentFqn = node.element.parent
        if (parentFqn) {
          const parent = buildNode(index.get(parentFqn)!)
          parents.add(parentFqn)
          parent.children.push(nd)
          parent.hasChildren = true
        } else {
          roots.push(nd)
        }
        newTree.set(nd.element.id, nd)
        return nd
      }

      for (const node of visibleElements) {
        buildNode(node)
      }
      return {
        treeData: roots,
        expanded: Array.from(parents),
        lookup: (id: Fqn) => newTree.get(id)!,
      }
    },
  }
}

export function useElementsColumnData() {
  const model = useLikeC4Model()

  const { allNodes, filterTree } = useMemo(() => dfs(model), [model])

  const fuzzy = useMemo(() =>
    createFuzzySearch(allNodes, [
      { name: 'name', getFn: ({ element }) => element.name },
      { name: 'title', getFn: ({ element }) => element.title },
      { name: 'id', getFn: ({ element }) => element.id },
      { name: 'summary', getFn: ({ element }) => element.summary },
    ]), [allNodes])

  const search = useNormalizedSearch()

  return useMemo(() => {
    const searchTerms = search.split('.')
    let elements
    if (search === '' || search === 'kind:') {
      elements = allNodes
    } else if (search.startsWith('kind:')) {
      const searchKind = search.slice(5)
      elements = filter(allNodes, ({ element }) => {
        return element.kind.toLocaleLowerCase()[searchKind.length > 4 ? 'startsWith' : 'includes'](searchKind)
      })
    } else if (search.startsWith('#')) {
      const searchTag = search.slice(1)
      elements = filter(allNodes, ({ element }) => {
        return element.tags.some((tag) => tag.toLocaleLowerCase().includes(searchTag))
      })
    } else if (search.startsWith(METADATA_SEARCH_PREFIX)) {
      elements = filter(allNodes, ({ element }) => matchesMetadataSearch(element.metadata, search))
    } else if (hasAtLeast(searchTerms, 2)) {
      const satisfies = ({ element }: LikeC4ModelTreeNodeData) => {
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
      elements = filter(allNodes, satisfies)
    } else {
      elements = fuzzy(search)
    }
    return {
      ...filterTree(elements),
      searchTerms: hasAtLeast(searchTerms, 1) ? searchTerms : [search] as NonEmptyArray<string>,
    }
  }, [allNodes, fuzzy, search, filterTree])
}
export type ElementsColumnData = ReturnType<typeof useElementsColumnData>
