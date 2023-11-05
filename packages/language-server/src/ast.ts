import {
  DefaultElementShape,
  DefaultThemeColor,
  RelationRefError,
  nonexhaustive,
  type c4,
  DefaultLineStyle,
  DefaultArrowType,
  DefaultRelationshipColor
} from '@likec4/core'
import type { LangiumDocument, MultiMap } from 'langium'
import { DocumentState } from 'langium'
import { elementRef } from './elementRef'
import type { LikeC4Document } from './generated/ast'
import * as ast from './generated/ast'
import { LikeC4LanguageMetaData } from './generated/module'
import { isNil } from 'remeda'

export { ast }

const idattr = Symbol.for('idattr')

declare module './generated/ast' {
  export interface Element {
    [idattr]?: c4.Fqn
  }
  export interface ElementView {
    [idattr]?: c4.ViewID
  }
}

export interface ParsedAstSpecification {
  // prettier-ignore
  kinds: Record<c4.ElementKind, {
    shape?: c4.ElementShape
    color?: c4.ThemeColor
    icon?: c4.IconUrl
  }>,
  relationships: Record<
    c4.RelationshipKind,
    {
      color?: c4.ThemeColor
      line?: c4.RelationshipLineType
      head?: c4.RelationshipArrowType
      tail?: c4.RelationshipArrowType
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
  kind?: c4.RelationshipKind
  tags?: c4.NonEmptyArray<c4.Tag>
  title: string
}

export interface ParsedAstElementView {
  id: c4.ViewID
  viewOf?: c4.Fqn
  extends?: c4.ViewID
  astPath: string
  title?: string
  description?: string
  tags?: c4.NonEmptyArray<c4.Tag>
  links?: c4.NonEmptyArray<string>
  rules: c4.ViewRule[]
}

export const ElementViewOps = {
  writeId(node: ast.ElementView, id: c4.ViewID) {
    node[idattr] = id
    return node
  },
  readId(node: ast.ElementView) {
    return node[idattr]
  }
}

export const ElementOps = {
  writeId(node: ast.Element, id: c4.Fqn | null) {
    if (isNil(id)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete node[idattr]
    } else {
      node[idattr] = id
    }
    return node
  },
  readId(node: ast.Element) {
    return node[idattr]
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

export interface LikeC4LangiumDocument
  extends LangiumDocument<LikeC4Document>,
    LikeC4DocumentProps {}
export type ParsedLikeC4LangiumDocument = Omit<LikeC4LangiumDocument, keyof LikeC4DocumentProps> &
  Required<LikeC4DocumentProps>

export function cleanParsedModel(doc: LikeC4LangiumDocument) {
  const props: Required<Omit<LikeC4DocumentProps, 'c4fqns'>> = {
    c4Specification: {
      kinds: {},
      relationships: {}
    },
    c4Elements: [],
    c4Relations: [],
    c4Views: []
  }
  Object.assign(doc, props)
  return doc as ParsedLikeC4LangiumDocument
}

export function isLikeC4LangiumDocument(doc: LangiumDocument): doc is LikeC4LangiumDocument {
  return doc.textDocument.languageId === LikeC4LanguageMetaData.languageId
}

export function isParsedLikeC4LangiumDocument(
  doc: LangiumDocument
): doc is ParsedLikeC4LangiumDocument {
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

export const isValidLikeC4LangiumDocument = (
  doc: LangiumDocument
): doc is ParsedLikeC4LangiumDocument => {
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

export function toRelationshipStyle(props?: ast.SpecificationRelationshipKind['props']) {
  const result: {
    color?: c4.ThemeColor
    line?: c4.RelationshipLineType
    head?: c4.RelationshipArrowType
    tail?: c4.RelationshipArrowType
  } = {}
  if (!props || props.length === 0) {
    return result
  }
  for (const prop of props) {
    if (ast.isColorProperty(prop)) {
      result.color = prop.value
      continue
    }
    if (ast.isLineProperty(prop)) {
      result.line = prop.value
      continue
    }
    if (ast.isArrowProperty(prop)) {
      switch (prop.key) {
        case 'head': {
          result.head = prop.value
          break
        }
        case 'tail': {
          result.tail = prop.value
          break
        }
        default: {
          nonexhaustive(prop)
        }
      }
      continue
    }
    nonexhaustive(prop)
  }
  return result
}

export function toRelationshipStyleExcludeDefaults(
  props?: ast.SpecificationRelationshipKind['props']
) {
  const { color, line, head, tail } = toRelationshipStyle(props)
  return {
    ...(color && color !== DefaultRelationshipColor ? { color } : {}),
    ...(line && line !== DefaultLineStyle ? { line } : {}),
    ...(head && head !== DefaultArrowType ? { head } : {}),
    ...(tail && tail !== DefaultArrowType ? { tail } : {})
  }
}

export function toAutoLayout(
  direction: ast.ViewRuleLayoutDirection
): c4.ViewRuleAutoLayout['autoLayout'] {
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
