import { AsFqn, nonexhaustive, type c4 } from '@likec4/core'
import { MultiMap } from 'langium'
import { isEmpty, isNil } from 'remeda'
import { ElementOps, ast, type LikeC4LangiumDocument } from '../ast'
import { strictElementRefFqn } from '../elementRef'
import type { LikeC4Services } from '../module'

type TraversePair = [el: ast.Element | ast.ExtendElement | ast.Relation, parent: c4.Fqn | null]

export function computeDocumentFqn(document: LikeC4LangiumDocument, services: LikeC4Services) {
  const c4fqns = (document.c4fqns = new MultiMap())
  const { model } = document.parseResult.value
  if (!model?.elements) {
    return
  }
  const locator = services.workspace.AstNodeLocator
  const traverseStack: TraversePair[] = model.elements.map(el => [el, null])
  let pair
  while ((pair = traverseStack.shift())) {
    const [el, parent] = pair
    if (ast.isRelation(el)) {
      continue
    }
    if (ast.isExtendElement(el)) {
      if (!isNil(el.body) && !isEmpty(el.body.elements)) {
        const fqn = strictElementRefFqn(el.element)
        el.body.elements.forEach(child => traverseStack.push([child, fqn]))
      }
      continue
    }
    if (ast.isElement(el)) {
      const fqn = AsFqn(el.name, parent)
      const path = locator.getAstNodePath(el)
      c4fqns.add(fqn, {
        el: new WeakRef(el),
        path,
        name: el.name
      })
      ElementOps.writeId(el, fqn)
      if (!isNil(el.body) && !isEmpty(el.body.elements)) {
        el.body.elements.forEach(child => traverseStack.push([child, fqn]))
      }
      continue
    }
    nonexhaustive(el)
  }
}
