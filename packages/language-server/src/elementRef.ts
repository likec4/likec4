import { type c4 } from '@likec4/core'
import type { ast } from './ast'
/**
 * Returns referenced AST Element
 *
 */
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export function elementRef(node: ast.ElementRef | ast.FqnElementRef) {
  return node.el.ref
}

/**
 * Returns FQN of FqnElementRef
 * a.b.c.d - for c node returns a.b.c
 */
export function getFqnElementRef(node: ast.FqnElementRef): c4.Fqn {
  // invariant(isElementRefHead(node), 'Expected head StrictElementRef')
  const name = [node.el.$refText]
  let parent = node.parent
  while (parent) {
    name.unshift(parent.el.$refText)
    parent = parent.parent
  }
  return name.join('.') as c4.Fqn
}
