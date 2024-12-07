import { AsFqn, nonexhaustive } from '@likec4/core'
import type * as c4 from '@likec4/core'
import { type AstNodeDescription, type AstNodeLocator, AstUtils, CstUtils, GrammarUtils, MultiMap } from 'langium'
import { isDefined, isEmpty } from 'remeda'
import { ast, ElementOps, type LikeC4LangiumDocument } from '../ast'
import { logError } from '../logger'
import type { LikeC4Services } from '../module'
import { getFqnElementRef } from '../utils/elementRef'

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
  const c4fqnIndex = (document.c4fqnIndex = new MultiMap())
  const elements = document.parseResult.value.models.flatMap(m => m.elements)
  if (elements.length === 0) {
    return
  }
  const locator = services.workspace.AstNodeLocator
  const traverseStack: TraversePair[] = elements.map(el => [el, null])
  let pair
  while ((pair = traverseStack.shift())) {
    try {
      const [el, parent] = pair
      if (ast.isRelation(el)) {
        continue
      }
      if (ast.isExtendElement(el)) {
        if (isDefined(el.body) && !isEmpty(el.body.elements)) {
          const fqn = getFqnElementRef(el.element)
          for (const child of el.body.elements) {
            if (!ast.isRelation(child)) {
              traverseStack.push([child, fqn])
            }
          }
        }
        continue
      }
      if (ast.isElement(el)) {
        const fqn = AsFqn(el.name, parent)
        c4fqnIndex.add(fqn, {
          ...toAstNodeDescription(locator, el, document),
          fqn
        })
        ElementOps.writeId(el, fqn)
        if (isDefined(el.body) && !isEmpty(el.body.elements)) {
          for (const child of el.body.elements) {
            if (!ast.isRelation(child)) {
              traverseStack.push([child, fqn])
            }
          }
        }
        continue
      }
      nonexhaustive(el)
    } catch (e) {
      logError(e)
    }
  }
}
