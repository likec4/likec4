import type { ComputedEdge, ComputedNode, ComputedView, ElementStyle } from '@likec4/core/types'
import objectHash from 'object-hash'
import { isString } from 'remeda'
import type { SetOptional } from 'type-fest'

export function applyViewHash<V extends ComputedView>(view: SetOptional<V, 'hash'>): V {
  const excludedkeys: string[] = [
    'manualLayout',
    'docUri',
    'links',
    'tags',
    'navigateTo',
    'children',
    'inEdges',
    'outEdges',
    'opacity',
    'border',
    'hash',
    'relativePath',
    'color',
    'source',
    'target',
    'line',
    'kind',
    'isCustomized',
    'relations'
  ] satisfies Array<keyof ComputedView | keyof ComputedEdge | keyof ComputedNode | keyof ElementStyle>
  const tohash = {
    id: view.id,
    __: view.__ ?? 'element',
    autoLayout: view.autoLayout,
    nodes: view.nodes.toSorted((a, b) => a.id.localeCompare(b.id)),
    edges: view.edges.toSorted((a, b) => a.id.localeCompare(b.id))
  }
  view.hash = objectHash(tohash, {
    ignoreUnknown: true,
    respectType: false,
    replacer(value) {
      if (!isString(value)) {
        return value
      }
      value = value.trim()
      if (value.match('^(aws|tech|gcp|https|http).+')) {
        value = 'U' // hide urls
      }
      return value
    },
    excludeKeys(key) {
      return excludedkeys.includes(key)
    }
  })
  return view as V
}
