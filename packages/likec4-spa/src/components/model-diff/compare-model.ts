import { type CompareViewMode, applyModelDiff } from '@likec4/core/compute-view'
import { ElementModel, LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import type { DiffId, LayoutedView, ParsedLikeC4ModelData } from '@likec4/core/types'

function idOf(value: string | { id: string }): string {
  return typeof value === 'string' ? value : value.id
}

function rootFolder(model: LikeC4Model) {
  const first = model.views().next().value
  if (!first) {
    return model.rootViewFolder
  }
  if (first.folder.isRoot) {
    return first.folder
  }
  return first.folder.parent ?? first.folder
}

/**
 * Model the detail popups read while a compare view is on screen.
 *
 * Added and modified elements come from the model after the diff.
 * Removed elements come from the model before the diff.
 * `as-is` reads only the model before the diff.
 * The open compare view replaces the view of the same id, so node lookup matches the diagram.
 */
export function compareLookupModel(
  before: LikeC4Model,
  input: { diffId: string; mode: CompareViewMode; view: LayoutedView },
): LikeC4Model {
  const diff = before.$data.diffs?.[input.diffId as DiffId]
  if (!diff) {
    return before
  }
  // A diff view is parsed and has no nodes. The open compare view is passed in separately.
  const after = input.mode === 'as-is'
    ? before
    : LikeC4Model.create(applyModelDiff(before.$data as ParsedLikeC4ModelData, { ...diff, views: {} }))
  const useAfter = input.mode !== 'as-is'

  let compareViewModel: LikeC4ViewModel | undefined
  const proxy = new Proxy(before, {
    get(target, prop, receiver) {
      switch (prop) {
        case 'element':
          return (el: string | { id: string }) => {
            if (el instanceof ElementModel) {
              return el
            }
            const found = useAfter ? after.findElement(idOf(el)) : null
            return found ?? target.element(el as never)
          }
        case 'findElement':
          return (el: string | { id: string }) => {
            const found = useAfter ? after.findElement(idOf(el)) : null
            return found ?? target.findElement(el as never)
          }
        case 'relationship':
          return (rel: string | { id: string }, type?: 'model' | 'deployment') => {
            if (!useAfter || type === 'deployment') {
              return target.relationship(rel as never, type as never)
            }
            return after.findRelationship(idOf(rel), type) ?? target.relationship(rel as never, type as never)
          }
        case 'findRelationship':
          return (id: string, type?: 'model' | 'deployment') => {
            if (!useAfter || type === 'deployment') {
              return target.findRelationship(id, type)
            }
            return after.findRelationship(id, type) ?? target.findRelationship(id, type)
          }
        case 'elements':
          return function*() {
            const seen = new Set<string>()
            if (useAfter) {
              for (const element of after.elements()) {
                seen.add(element.id)
                yield element
              }
            }
            for (const element of target.elements()) {
              if (!seen.has(element.id)) {
                yield element
              }
            }
          }
        case 'roots':
          return function*() {
            const seen = new Set<string>()
            if (useAfter) {
              for (const element of after.roots()) {
                seen.add(element.id)
                yield element
              }
            }
            for (const element of target.roots()) {
              if (!seen.has(element.id)) {
                yield element
              }
            }
          }
        case 'findView':
          return (viewId: string) => viewModel(viewId) ?? target.findView(viewId as never)
        case 'view':
          return (viewId: string | { id: string }) => {
            const id = idOf(viewId)
            return viewModel(id) ?? target.view(viewId as never)
          }
        default: {
          const value = Reflect.get(target, prop, receiver)
          return typeof value === 'function' ? value.bind(target) : value
        }
      }
    },
  }) as LikeC4Model

  function viewModel(viewId: string): LikeC4ViewModel | null {
    if (viewId !== input.view.id) {
      return null
    }
    if (!compareViewModel) {
      const folder = before.findView(input.view.id)?.folder ?? rootFolder(before)
      if (!folder) {
        return null
      }
      compareViewModel = new LikeC4ViewModel(proxy, folder, input.view)
    }
    return compareViewModel
  }

  return proxy
}
