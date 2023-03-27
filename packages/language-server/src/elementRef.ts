import type * as c4 from '@likec4/core/types'
import { ast } from './ast'
import invariant from 'tiny-invariant'
import { failExpectedNever } from './utils'

export function isElementRefHead(node: ast.ElementRef | ast.StrictElementRef) {
  if (ast.isElementRef(node)) {
    return !ast.isElementRef(node.$container)
  }
  if (ast.isStrictElementRef(node)) {
    return !ast.isStrictElementRef(node.$container)
  }
  failExpectedNever(node)
}

export function elementRef(node: ast.ElementRef) {
  invariant(!ast.isElementRef(node.$container), 'Expected head ElementRef')
  while (node.next) {
    node = node.next
  }
  return node.el.ref
}


export function strictElementRefFqn(node: ast.StrictElementRef): c4.Fqn {
  invariant(!ast.isStrictElementRef(node.$container), 'Expected head StrictElementRef')
  const name = [node.el.$refText]
  let child = node.next
  while (child) {
    name.push(child.el.$refText)
    child = child.next
  }
  return name.join('.') as c4.Fqn
}

export function parentStrictElementRef(node: ast.StrictElementRef): c4.Fqn {
  invariant(ast.isStrictElementRef(node.$container), 'Expected next StrictElementRef')
  const path = []
  let parent = node.$container as unknown
  while (ast.isStrictElementRef(parent)) {
    path.unshift(parent.el.$refText)
    parent = parent.$container
  }
  return path.join('.') as c4.Fqn
}
