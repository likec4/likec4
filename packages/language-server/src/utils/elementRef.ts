import type * as c4 from '@likec4/core'
import type { ast } from '../ast'
/**
 * Returns referenced AST Element
 */
export function elementRef(node: ast.ElementRef | ast.StrictFqnElementRef) {
  return node.el.ref
}

/**
 * Returns FQN of StrictFqnElementRef
 * a.b.c.d - for c node returns a.b.c
 */
export function getFqnElementRef(node: ast.StrictFqnElementRef): c4.Fqn {
  // invariant(isElementRefHead(node), 'Expected head StrictElementRef')
  const name = [node.el.$refText]
  let parent = node.parent
  while (parent) {
    name.push(parent.el.$refText)
    parent = parent.parent
  }
  if (name.length === 1) {
    return name[0] as c4.Fqn
  }
  return name.reverse().join('.') as c4.Fqn
}
