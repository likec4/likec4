import type * as c4 from '@likec4/core/types'
import { ast } from './ast'

export function elementRef(node: ast.ElementRef | ast.ElementDescendantRef) {
  while (node.next) {
    node = node.next
  }
  return node.el.ref
}


export function strictElementRefFqn(node: ast.StrictElementRef): c4.Fqn {
  const name = [node.el.$refText]
  let child = node.child
  while (child) {
    name.push(child.el.$refText)
    child = child.child
  }
  return name.join('.') as c4.Fqn
}

export function parentFqnOfStrictElementChildRef(node: ast.StrictElementChildRef): c4.Fqn {
  const path = []
  let parent = node.$container
  while (true) {
    path.unshift(parent.el.$refText)
    if (ast.isStrictElementRef(parent)) {
      break
    }
    parent = parent.$container
  }
  return path.join('.') as c4.Fqn
}
