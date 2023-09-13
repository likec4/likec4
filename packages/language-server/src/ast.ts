import { DefaultElementShape, DefaultThemeColor, RelationRefError, nonexhaustive, type c4 } from '@likec4/core'
import type { LangiumDocument, MultiMap } from 'langium'
import { DocumentState } from 'langium'
import { elementRef } from './elementRef'
import type { LikeC4Document } from './generated/ast'
import * as ast from './generated/ast'
import { LikeC4LanguageMetaData } from './generated/module'

export { ast }

declare module './generated/ast' {
  export interface Element {
    fqn?: c4.Fqn
  }
}

export interface ParsedAstSpecification {
  // prettier-ignore
  kinds: Record<c4.ElementKind, {
    shape?: c4.ElementShape
    color?: c4.ThemeColor
    icon?: c4.IconUrl
  }>
}

export interface ParsedAstElement {
  id: c4.Fqn
  astPath: string
  kind: c4.ElementKind
  title: string
  description?: string
  technology?: string
  icon?: c4.IconUrl
  tags?: c4.NonEmptyArray<c4.Tag>
  links?: c4.NonEmptyArray<string>
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

export interface ParsedAstBasicElementView {
  id: c4.ViewID
  astPath: string
  title?: string
  description?: string
  tags?: c4.NonEmptyArray<c4.Tag>
  links?: c4.NonEmptyArray<string>
  rules: c4.ViewRule[]
}

export interface ParsedAstStrictElementView extends ParsedAstBasicElementView {
  viewOf: c4.Fqn
}
export interface ParsedAstExtendsElementView extends ParsedAstBasicElementView {
  extends: c4.ViewID
}

export type ParsedAstElementView = ParsedAstStrictElementView | ParsedAstExtendsElementView | ParsedAstBasicElementView

const idattr = Symbol.for('idattr')
export const ElementViewOps = {
  writeId(node: ast.ElementView, id: c4.ViewID) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-extra-semi
    ;(node as any)[idattr] = id
    return node
  },
  readId(node: ast.ElementView) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (node as any)[idattr] as c4.ViewID | undefined
  }
}

export const ElementOps = {
  writeId(node: ast.Element, id: c4.Fqn | null) {
    if (id === null) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-dynamic-delete
      delete (node as any)[idattr]
      delete node.fqn
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, no-extra-semi
      ;(node as any)[idattr] = id
      node.fqn = id
    }
    return node
  },
  readId(node: ast.Element) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (node as any)[idattr] as c4.Fqn | undefined
  }
}

export interface DocFqnIndexEntry {
  name: string
  el: WeakRef<ast.Element>
  path: string
}

export interface LikeC4DocumentProps {
  c4Specification?: ParsedAstSpecification
  c4Elements?: ParsedAstElement[]
  c4Relations?: ParsedAstRelation[]
  c4Views?: ParsedAstElementView[]

  // Fqn -> Element
  c4fqns?: MultiMap<c4.Fqn, DocFqnIndexEntry>
}

export interface LikeC4LangiumDocument extends LangiumDocument<LikeC4Document>, LikeC4DocumentProps {}
export type ParsedLikeC4LangiumDocument = Omit<LikeC4LangiumDocument, keyof LikeC4DocumentProps> &
  Required<LikeC4DocumentProps>

export function cleanParsedModel(doc: LikeC4LangiumDocument) {
  const specification = (doc.c4Specification = {
    kinds: {}
  } as ParsedAstSpecification)
  const elements = (doc.c4Elements = [] as ParsedAstElement[])
  const relations = (doc.c4Relations = [] as ParsedAstRelation[])
  const views = (doc.c4Views = [] as ParsedAstElementView[])
  return {
    elements,
    relations,
    views,
    specification
  }
}

export function isLikeC4LangiumDocument(doc: LangiumDocument): doc is LikeC4LangiumDocument {
  return doc.textDocument.languageId === LikeC4LanguageMetaData.languageId
}

export function isParsedLikeC4LangiumDocument(doc: LangiumDocument): doc is ParsedLikeC4LangiumDocument {
  return (
    isLikeC4LangiumDocument(doc) &&
    doc.state >= DocumentState.Validated &&
    !!doc.c4Specification &&
    !!doc.c4Elements &&
    !!doc.c4Relations &&
    !!doc.c4Views &&
    !!doc.c4fqns
  )
}

export const isValidLikeC4LangiumDocument = (doc: LangiumDocument): doc is ParsedLikeC4LangiumDocument => {
  if (!isParsedLikeC4LangiumDocument(doc)) return false
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
    if (ast.isRelation(el)) {
      relations.push(el)
      continue
    }
    if (ast.isExtendElement(el)) {
      if (el.body && el.body.elements.length > 0) {
        traverseStack.push(...el.body.elements)
      }
      continue
    }
    if (el.body && el.body.elements.length > 0) {
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
    throw new RelationRefError('Invalid reference to target')
  }
  if ('source' in node) {
    const source = elementRef(node.source)
    if (!source) {
      throw new RelationRefError('Invalid reference to source')
    }
    return {
      source,
      target
    }
  }
  if (!ast.isElementBody(node.$container)) {
    throw new RelationRefError('Invalid relation parent, expected Element')
  }
  return {
    source: node.$container.$container,
    target
  }
}

export function toElementStyle(props?: ast.StyleProperties['props']) {
  const result: {
    color?: c4.ThemeColor
    shape?: c4.ElementShape
    icon?: c4.IconUrl
  } = {}
  if (!props || props.length === 0) {
    return result
  }
  for (const prop of props) {
    if (ast.isColorProperty(prop)) {
      result.color = prop.value
      continue
    }
    if (ast.isShapeProperty(prop)) {
      result.shape = prop.value
      continue
    }
    if (ast.isIconProperty(prop)) {
      result.icon = prop.value as c4.IconUrl
      continue
    }
    nonexhaustive(prop)
  }
  return result
}
export function toElementStyleExcludeDefaults(props?: ast.StyleProperties['props']) {
  const { color, shape, ...rest } = toElementStyle(props)
  return {
    ...rest,
    ...(color && color !== DefaultThemeColor ? { color } : {}),
    ...(shape && shape !== DefaultElementShape ? { shape } : {})
  }
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
