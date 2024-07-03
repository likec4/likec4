import { AsFqn, type c4, nonexhaustive } from '@likec4/core'
import { type AstNodeDescription, type AstNodeLocator, AstUtils, CstUtils, GrammarUtils, MultiMap } from 'langium'
import { isEmpty, isNullish as isNil } from 'remeda'
import { ast, ElementOps, type LikeC4LangiumDocument } from '../ast'
import { getFqnElementRef } from '../elementRef'
import type { LikeC4Services } from '../module'

const { findNodeForProperty } = GrammarUtils
const { toDocumentSegment } = CstUtils
const { getDocument } = AstUtils

type TraversePair = [el: ast.Element | ast.ExtendElement | ast.Relation, parent: c4.Fqn | null]

function toAstNodeDescription(
  locator: AstNodeLocator,
  entry: ast.Element,
  doc: LikeC4LangiumDocument
): AstNodeDescription {
  const $cstNode = findNodeForProperty(entry.$cstNode, 'name')
  return {
    documentUri: doc.uri,
    name: entry.name,
    ...(entry.$cstNode && {
      selectionSegment: toDocumentSegment(entry.$cstNode)
    }),
    ...($cstNode && {
      nameSegment: toDocumentSegment($cstNode)
    }),
    path: locator.getAstNodePath(entry),
    type: ast.Element
  }
}

export function computeDocumentFqn(document: LikeC4LangiumDocument, services: LikeC4Services) {
  const c4fqns = (document.c4fqns = new MultiMap())
  const c4fqnIndex = (document.c4fqnIndex = new MultiMap())
  const elements = document.parseResult.value.models.flatMap(m => m.elements)
  if (elements.length === 0) {
    return
  }
  const locator = services.workspace.AstNodeLocator
  const traverseStack: TraversePair[] = elements.map(el => [el, null])
  let pair
  while ((pair = traverseStack.shift())) {
    const [el, parent] = pair
    if (ast.isRelation(el)) {
      continue
    }
    if (ast.isExtendElement(el)) {
      if (!isNil(el.body) && !isEmpty(el.body.elements)) {
        const fqn = getFqnElementRef(el.element)
        el.body.elements.forEach(child => traverseStack.push([child, fqn]))
      }
      continue
    }
    if (ast.isElement(el)) {
      const fqn = AsFqn(el.name, parent)
      const astNodeDescription = toAstNodeDescription(locator, el, document)
      c4fqns.add(fqn, {
        el: new WeakRef(el),
        path: astNodeDescription.path,
        name: el.name
      })
      c4fqnIndex.add(fqn, {
        ...astNodeDescription,
        fqn
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
