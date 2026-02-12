import type { Element, Relationship } from '@likec4/core/types'
import { CompositeGeneratorNode, NL } from 'langium/generate'
import { printStyleBlock } from './print-style'
import { type ElementTreeNode, buildTree, printModelRef, quoteMarkdownOrString, quoteString } from './utils'

export function printModel(
  out: CompositeGeneratorNode,
  elements: Record<string, Element>,
  relations: Record<string, Relationship>,
): void {
  out.append('model {', NL)
  out.indent({
    indentedChildren: indent => {
      // Build element tree from flat map
      const roots = buildTree(elements)

      // Print element tree
      for (const root of roots) {
        printElementNode(indent, root)
      }

      // Print all relations at root level
      for (const rel of Object.values(relations)) {
        printRelation(indent, rel)
      }
    },
    indentation: 2,
  })
  out.append('}', NL)
}

function printElementNode(
  indent: CompositeGeneratorNode,
  node: ElementTreeNode<Element>,
): void {
  const el = node.element
  const hasChildren = node.children.length > 0
  const hasProps = hasElementProps(el)
  const needsBody = hasChildren || hasProps

  indent.append(node.name, ' = ', el.kind as string)

  if (el.title) {
    indent.append(' ', quoteString(el.title))
  }

  if (!needsBody) {
    indent.append(NL)
    return
  }

  indent.append(' {', NL)
  indent.indent({
    indentedChildren: inner => {
      printElementProps(inner, el)

      for (const child of node.children) {
        printElementNode(inner, child)
      }
    },
    indentation: 2,
  })
  indent.append('}', NL)
}

function hasElementProps(el: Element): boolean {
  return !!(
    el.description || el.summary || el.technology || el.notation
    || (el.tags && el.tags.length > 0)
    || (el.links && el.links.length > 0)
    || (el.metadata && Object.keys(el.metadata).length > 0)
    || hasStyleProps(el.style)
  )
}

function hasStyleProps(style: Element['style']): boolean {
  return !!(style.shape || style.color || style.icon || style.iconColor
    || style.iconSize || style.iconPosition || style.border
    || style.opacity != null || style.multiple
    || style.size || style.padding || style.textSize)
}

function printElementProps(indent: CompositeGeneratorNode, el: Element): void {
  if (el.description) {
    indent.append('description ', quoteMarkdownOrString(el.description), NL)
  }
  if (el.summary) {
    indent.append('summary ', quoteMarkdownOrString(el.summary), NL)
  }
  if (el.technology) {
    indent.append('technology ', quoteString(el.technology), NL)
  }
  if (el.notation) {
    indent.append('notation ', quoteString(el.notation), NL)
  }
  if (el.tags && el.tags.length > 0) {
    indent.append('#', (el.tags as string[]).join(' #'), NL)
  }
  if (el.links && el.links.length > 0) {
    for (const link of el.links) {
      indent.append('link ', link.url)
      if (link.title) indent.append(' ', quoteString(link.title))
      indent.append(NL)
    }
  }
  if (el.metadata) {
    const entries = Object.entries(el.metadata)
    if (entries.length > 0) {
      indent.append('metadata {', NL)
      indent.indent({
        indentedChildren: metaIndent => {
          for (const [key, value] of entries) {
            if (Array.isArray(value)) {
              metaIndent.append(key, ' [', value.map(v => quoteString(v)).join(', '), ']', NL)
            } else {
              metaIndent.append(key, ' ', quoteString(value as string), NL)
            }
          }
        },
        indentation: 2,
      })
      indent.append('}', NL)
    }
  }
  if (hasStyleProps(el.style)) {
    printStyleBlock(el.style, indent)
  }
}

function printRelation(indent: CompositeGeneratorNode, rel: Relationship): void {
  const source = printModelRef(rel.source)
  const target = printModelRef(rel.target)

  indent.append(source, ' ')

  if (rel.kind) {
    indent.append('-[', rel.kind as string, ']-> ')
  } else {
    indent.append('-> ')
  }

  indent.append(target)

  if (rel.title) {
    indent.append(' ', quoteString(rel.title))
  }

  const hasBody = hasRelationProps(rel)
  if (!hasBody) {
    indent.append(NL)
    return
  }

  indent.append(' {', NL)
  indent.indent({
    indentedChildren: inner => {
      printRelationProps(inner, rel)
    },
    indentation: 2,
  })
  indent.append('}', NL)
}

function hasRelationProps(rel: Relationship): boolean {
  return !!(
    rel.description || rel.summary || rel.technology
    || (rel.tags && rel.tags.length > 0)
    || (rel.links && rel.links.length > 0)
    || (rel.metadata && Object.keys(rel.metadata).length > 0)
    || rel.color || rel.line || rel.head || rel.tail
    || rel.navigateTo
  )
}

function printRelationProps(indent: CompositeGeneratorNode, rel: Relationship): void {
  if (rel.description) {
    indent.append('description ', quoteMarkdownOrString(rel.description), NL)
  }
  if (rel.summary) {
    indent.append('summary ', quoteMarkdownOrString(rel.summary), NL)
  }
  if (rel.technology) {
    indent.append('technology ', quoteString(rel.technology), NL)
  }
  if (rel.tags && rel.tags.length > 0) {
    indent.append('#', (rel.tags as string[]).join(' #'), NL)
  }
  if (rel.links && rel.links.length > 0) {
    for (const link of rel.links) {
      indent.append('link ', link.url)
      if (link.title) indent.append(' ', quoteString(link.title))
      indent.append(NL)
    }
  }
  if (rel.metadata) {
    const entries = Object.entries(rel.metadata)
    if (entries.length > 0) {
      indent.append('metadata {', NL)
      indent.indent({
        indentedChildren: metaIndent => {
          for (const [key, value] of entries) {
            if (Array.isArray(value)) {
              metaIndent.append(key, ' [', value.map(v => quoteString(v)).join(', '), ']', NL)
            } else {
              metaIndent.append(key, ' ', quoteString(value as string), NL)
            }
          }
        },
        indentation: 2,
      })
      indent.append('}', NL)
    }
  }
  if (rel.color) indent.append('color ', rel.color, NL)
  if (rel.line) indent.append('line ', rel.line, NL)
  if (rel.head) indent.append('head ', rel.head, NL)
  if (rel.tail) indent.append('tail ', rel.tail, NL)
  if (rel.navigateTo) indent.append('navigateTo ', rel.navigateTo as string, NL)
}
