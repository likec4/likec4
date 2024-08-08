import type { ComputedView } from '@likec4/core/types'
import objectHash from 'object-hash'
import { isString, pick } from 'remeda'
import type { SetOptional } from 'type-fest'

export function calcViewLayoutHash<V extends ComputedView>(view: SetOptional<V, 'hash'>): V {
  const tohash = {
    id: view.id,
    __: view.__ ?? 'element',
    autoLayout: view.autoLayout,
    nodes: view.nodes
      .map(pick(['id', 'title', 'description', 'technology', 'shape', 'icon', 'children']))
      .toSorted((a, b) => a.id.localeCompare(b.id)),
    edges: view.edges
      .map(pick(['id', 'source', 'target', 'label', 'description', 'technology', 'dir', 'head', 'tail', 'line']))
      .toSorted((a, b) => a.id.localeCompare(b.id))
  }
  view.hash = objectHash(tohash, {
    ignoreUnknown: true,
    respectType: false,
    replacer(value) {
      if (!isString(value)) {
        return value
      }
      value = value.trim()
      if (value.match('^(aws|tech|gcp|https|http)')) {
        value = 'U' // hide urls
      }
      return value
    }
  })
  return view as V
}
