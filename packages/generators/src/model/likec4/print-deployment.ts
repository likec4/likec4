import type { DeploymentElement, DeploymentRelationship } from '@likec4/core/types'
import { FqnRef, isDeployedInstance, isDeploymentNode } from '@likec4/core/types'
import { CompositeGeneratorNode, NL } from 'langium/generate'
import { printStyleBlock } from './print-style'
import {
  type ElementTreeNode,
  buildTree,
  printDeploymentRef,
  quoteMarkdownOrString,
  quoteString,
} from './utils'

export function printDeployment(
  out: CompositeGeneratorNode,
  deployments: {
    elements: Record<string, DeploymentElement>
    relations: Record<string, DeploymentRelationship>
  },
): void {
  const hasElements = Object.keys(deployments.elements).length > 0
  const hasRelations = Object.keys(deployments.relations).length > 0
  if (!hasElements && !hasRelations) return

  out.append('deployment {', NL)
  out.indent({
    indentedChildren: indent => {
      const roots = buildTree(deployments.elements)

      for (const root of roots) {
        printDeploymentNode(indent, root)
      }

      for (const rel of Object.values(deployments.relations)) {
        printDeploymentRelation(indent, rel)
      }
    },
    indentation: 2,
  })
  out.append('}', NL)
}

function printDeploymentNode(
  indent: CompositeGeneratorNode,
  node: ElementTreeNode<DeploymentElement>,
): void {
  const el = node.element

  if (isDeployedInstance(el)) {
    // Print as: instanceOf <element>
    // Or: <name> = instanceOf <element>
    const elementFqn = el.element as string
    const elementLocalName = elementFqn.split('.').pop()
    const needsName = node.name !== elementLocalName

    if (needsName) {
      indent.append(node.name, ' = ')
    }
    indent.append('instanceOf ', elementFqn)

    const hasProps = !!(el.title || el.description || el.summary || el.technology
      || (el.tags && el.tags.length > 0)
      || (el.links && el.links.length > 0))

    if (!hasProps && node.children.length === 0) {
      indent.append(NL)
      return
    }

    indent.append(' {', NL)
    indent.indent({
      indentedChildren: inner => {
        printDeploymentElementProps(inner, el)
        for (const child of node.children) {
          printDeploymentNode(inner, child)
        }
      },
      indentation: 2,
    })
    indent.append('}', NL)
    return
  }

  if (isDeploymentNode(el)) {
    indent.append(el.kind as string, ' ', node.name)

    if (el.title) {
      indent.append(' ', quoteString(el.title))
    }

    const hasProps = hasDeploymentNodeProps(el)
    if (!hasProps && node.children.length === 0) {
      indent.append(NL)
      return
    }

    indent.append(' {', NL)
    indent.indent({
      indentedChildren: inner => {
        printDeploymentElementProps(inner, el)
        for (const child of node.children) {
          printDeploymentNode(inner, child)
        }
      },
      indentation: 2,
    })
    indent.append('}', NL)
    return
  }

  throw new Error(`printDeploymentNode: unexpected element type for '${node.name}' (kind: ${el.kind})`)
}

function hasDeploymentNodeProps(el: DeploymentElement): boolean {
  return !!(
    el.description || el.summary || el.technology || el.notation
    || (el.tags && el.tags.length > 0)
    || (el.links && el.links.length > 0)
    || (el.metadata && Object.keys(el.metadata).length > 0)
    || hasStyleProps(el.style)
  )
}

function hasStyleProps(style: DeploymentElement['style']): boolean {
  return !!(style.shape || style.color || style.icon || style.iconColor
    || style.iconSize || style.iconPosition || style.border
    || style.opacity != null || style.multiple
    || style.size || style.padding || style.textSize)
}

function printDeploymentElementProps(indent: CompositeGeneratorNode, el: DeploymentElement): void {
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

function printDeploymentRelation(indent: CompositeGeneratorNode, rel: DeploymentRelationship): void {
  const source = printDeploymentRef(rel.source)
  const target = printDeploymentRef(rel.target)

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

  const hasBody = !!(
    rel.description || rel.technology || rel.color || rel.line || rel.head || rel.tail
    || rel.navigateTo || (rel.tags && rel.tags.length > 0)
    || (rel.links && rel.links.length > 0)
  )

  if (!hasBody) {
    indent.append(NL)
    return
  }

  indent.append(' {', NL)
  indent.indent({
    indentedChildren: inner => {
      if (rel.description) inner.append('description ', quoteMarkdownOrString(rel.description), NL)
      if (rel.technology) inner.append('technology ', quoteString(rel.technology), NL)
      if (rel.tags && rel.tags.length > 0) inner.append('#', (rel.tags as string[]).join(' #'), NL)
      if (rel.links && rel.links.length > 0) {
        for (const link of rel.links) {
          inner.append('link ', link.url)
          if (link.title) inner.append(' ', quoteString(link.title))
          inner.append(NL)
        }
      }
      if (rel.color) inner.append('color ', rel.color, NL)
      if (rel.line) inner.append('line ', rel.line, NL)
      if (rel.head) inner.append('head ', rel.head, NL)
      if (rel.tail) inner.append('tail ', rel.tail, NL)
      if (rel.navigateTo) inner.append('navigateTo ', rel.navigateTo as string, NL)
    },
    indentation: 2,
  })
  indent.append('}', NL)
}
