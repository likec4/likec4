import type * as c4 from '@likec4/core/types'
import type { LangiumDocument, MultiMap } from 'langium'
import { DocumentState } from 'langium/lib/workspace'
import objectHash from 'object-hash'
import { elementRef } from './elementRef'
import type { LikeC4Document } from './generated/ast'
import * as ast from './generated/ast'
import { LikeC4LanguageMetaData } from './generated/module'

export { ast }

export function c4hash({
  c4Specification,
  c4Elements,
  c4Relations,
  c4Views
}: LikeC4LangiumDocument) {
  return objectHash(
    {
      c4Specification,
      c4Elements,
      c4Relations,
      c4Views
    },
    {
      respectType: false
    }
  )
}

export interface ParsedAstSpecification {
  kinds: Record<
    c4.ElementKind,
    {
      shape: c4.ElementShape
      color: c4.ThemeColor
    }
  >
}

export interface ParsedAstElement {
  id: c4.Fqn
  astPath: string
  kind: c4.ElementKind
  title: string
  description?: string
  technology?: string
  tags?: c4.Tag[]
  shape?: c4.ElementShape
  color?: c4.ThemeColor
}

export interface ParsedAstRelation {
  id: c4.RelationID
  astPath: string
  source: c4.Fqn
  target: c4.Fqn
  title: string
}

export interface ParsedAstElementView {
  id: c4.ViewID
  astPath: string
  viewOf?: c4.Fqn
  title?: string
  description?: string
  rules: c4.ViewRule[]
}

const idattr = Symbol.for('idattr')
export const ElementViewOps = {
  writeId(node: ast.ElementView, id: c4.ViewID) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node as any)[idattr] = id
    return node
  },
  readId(node: ast.ElementView) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (node as any)[idattr] as c4.ViewID | undefined
  }
}

export const ElementOps = {
  writeId(node: ast.Element, id: c4.Fqn | null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (id === null) {
      delete (node as any)[idattr]
    } else {
      (node as any)[idattr] = id
    }
    return node
  },
  readId(node: ast.Element) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (node as any)[idattr] as c4.Fqn | undefined
  }
}

export interface LikeC4LangiumDocument extends LangiumDocument<LikeC4Document> {
  c4hash?: string
  c4Specification: ParsedAstSpecification
  c4Elements: ParsedAstElement[]
  c4Relations: ParsedAstRelation[]
  c4Views: ParsedAstElementView[]

  // Fqn -> astPath
  c4fqns?: MultiMap<c4.Fqn, string> | undefined
}

export function cleanParsedModel(doc: LikeC4LangiumDocument) {
  doc.c4Specification = {
    kinds: {}
  }
  const elements = (doc.c4Elements = [] as LikeC4LangiumDocument['c4Elements'])
  const relations = (doc.c4Relations = [] as LikeC4LangiumDocument['c4Relations'])
  const views = (doc.c4Views = [] as LikeC4LangiumDocument['c4Views'])
  return {
    elements,
    relations,
    views,
    specification: doc.c4Specification
  }
}

export function isLikeC4LangiumDocument(doc: LangiumDocument): doc is LikeC4LangiumDocument {
  return doc.textDocument.languageId === LikeC4LanguageMetaData.languageId
}

export function isParsedLikeC4LangiumDocument(doc: LangiumDocument): doc is LikeC4LangiumDocument {
  return (
    isLikeC4LangiumDocument(doc) &&
    ['c4Specification', 'c4Elements', 'c4Relations', 'c4Views'].every(key => key in doc)
  )
}

export const isValidDocument = (doc: LangiumDocument): doc is LikeC4LangiumDocument => {
  if (!isLikeC4LangiumDocument(doc)) return false
  const { state, parseResult, diagnostics } = doc
  return (
    state === DocumentState.Validated &&
    parseResult.lexerErrors.length === 0 &&
    (!diagnostics || diagnostics.every(d => d.severity !== 1))
  )
}

export function* streamModel(doc: LikeC4LangiumDocument) {
  const elements = doc.parseResult.value.model?.elements ?? []
  const traverseStack = [...elements]
  const relations = [] as ast.Relation[]
  let el
  while ((el = traverseStack.shift())) {
    if (ast.isRelationWithSource(el)) {
      relations.push(el)
      continue
    }
    if (ast.isExtendElement(el)) {
      if (el.body && el.body.elements.length > 0) {
        traverseStack.push(...el.body.elements)
      }
      continue
    }
    if (ast.isElement(el) && el.body && el.body.elements.length > 0) {
      for (const nested of el.body.elements) {
        if (ast.isRelation(nested)) {
          relations.push(nested)
        } else {
          traverseStack.push(nested)
        }
      }
    }
    yield el
  }
  for (const relation of relations) {
    yield relation
  }
}

export function resolveRelationPoints(node: ast.Relation): {
  source: ast.Element
  target: ast.Element
} {
  const target = elementRef(node.target)
  if (!target) {
    throw new Error('Skip relation due to invalid reference to target')
  }
  if (ast.isRelationWithSource(node)) {
    const source = elementRef(node.source)
    if (!source) {
      throw new Error('Skip relation due to invalid reference to source')
    }
    return {
      source,
      target
    }
  }
  if (!ast.isElementBody(node.$container)) {
    throw new Error('Skip relation due to invalid reference to source')
  }
  const source = node.$container.$container
  return {
    source,
    target
  }
}

export function toElementStyle(props?: ast.AStyleProperty[]) {
  const result: {
    color?: c4.ThemeColor
    shape?: c4.ElementShape
  } = {}
  const color = props?.find(ast.isColorProperty)?.value
  if (color) {
    result.color = color
  }
  const shape = props?.find(ast.isShapeProperty)?.value
  if (shape) {
    result.shape = shape
  }

  return result
}

export function toAutoLayout(direction: ast.ViewRuleLayoutDirection): c4.ViewRuleAutoLayout['autoLayout'] {
  switch (direction) {
    case 'TopBottom': {
      return 'TB'
    }
    case 'BottomTop': {
      return 'BT'
    }
    case 'LeftRight': {
      return 'LR'
    }
    case 'RightLeft': {
      return 'RL'
    }
  }
}
