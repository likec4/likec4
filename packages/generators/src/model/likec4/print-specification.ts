import type { ThemeColorValues } from '@likec4/core/styles'
import type { ElementSpecification, RelationshipSpecification, TagSpecification } from '@likec4/core/types'
import { isTagColorSpecified } from '@likec4/core/types'
import { CompositeGeneratorNode, NL } from 'langium/generate'
import { type Op, body, print, property, spaceBetween } from './base'
import { printStyleProperties, styleProperty } from './print-style'
import { descriptionProperty, notationProperty, printTags, summaryProperty, technologyProperty } from './properties'
import { quoteMarkdownOrString, quoteString } from './utils'

interface SpecificationData {
  customColors?: Record<string, ThemeColorValues>
  elements: Record<string, Partial<ElementSpecification>>
  deployments: Record<string, Partial<ElementSpecification>>
  relationships: Record<string, Partial<RelationshipSpecification>>
  tags: Record<string, TagSpecification>
  metadataKeys?: string[]
}

export function printSpecification(
  out: CompositeGeneratorNode,
  spec: SpecificationData,
): void {
  out.append('specification {', NL)
  out.indent({
    indentedChildren: indent => {
      // Custom colors
      if (spec.customColors) {
        for (const [name, colorValues] of Object.entries(spec.customColors)) {
          const hex = colorValues?.elements?.hiContrast ?? colorValues?.elements?.loContrast
          if (hex) {
            indent.append('color ', name, ' ', hex, NL)
          }
        }
      }

      // Element kinds
      for (const [kind, elSpec] of Object.entries(spec.elements)) {
        printElementKindSpec(indent, 'element', kind, elSpec)
      }

      // Deployment node kinds
      for (const [kind, dnSpec] of Object.entries(spec.deployments)) {
        printElementKindSpec(indent, 'deploymentNode', kind, dnSpec)
      }

      // Relationship kinds
      for (const [kind, relSpec] of Object.entries(spec.relationships)) {
        const hasProps = relSpec.color || relSpec.line || relSpec.head || relSpec.tail
          || relSpec.technology || relSpec.notation
        if (!hasProps) {
          indent.append('relationship ', kind, NL)
        } else {
          indent.append('relationship ', kind, ' {', NL)
          indent.indent({
            indentedChildren: inner => {
              if (relSpec.color) inner.append('color ', relSpec.color, NL)
              if (relSpec.line) inner.append('line ', relSpec.line, NL)
              if (relSpec.head) inner.append('head ', relSpec.head, NL)
              if (relSpec.tail) inner.append('tail ', relSpec.tail, NL)
              if (relSpec.technology) inner.append('technology ', quoteString(relSpec.technology), NL)
              if (relSpec.notation) inner.append('notation ', quoteString(relSpec.notation), NL)
            },
            indentation: 2,
          })
          indent.append('}', NL)
        }
      }

      // Tags
      for (const [tag, tagSpec] of Object.entries(spec.tags)) {
        if (isTagColorSpecified(tagSpec)) {
          indent.append('tag ', tag, ' {', NL)
          indent.indent({
            indentedChildren: inner => {
              inner.append('color ', tagSpec.color, NL)
            },
            indentation: 2,
          })
          indent.append('}', NL)
        } else {
          indent.append('tag ', tag, NL)
        }
      }

      // Metadata keys
      if (spec.metadataKeys) {
        for (const key of spec.metadataKeys) {
          indent.append('metadataKey ', key, NL)
        }
      }
    },
    indentation: 2,
  })
  out.append('}', NL)
}

function printElementKindSpec(
  indent: CompositeGeneratorNode,
  keyword: 'element' | 'deploymentNode',
  kind: string,
  elSpec: Partial<ElementSpecification>,
): void {
  const hasNotation = !!elSpec.notation
  const hasSummary = !!elSpec.summary
  const hasDescription = !!elSpec.description
  const hasTechnology = !!elSpec.technology
  const hasTitle = !!elSpec.title
  const hasStyle = elSpec.style &&
    Object.keys(elSpec.style).some(k => (elSpec.style as Record<string, unknown>)[k] != null)
  const hasLinks = elSpec.links && elSpec.links.length > 0
  const hasTags = elSpec.tags && elSpec.tags.length > 0
  const hasBody = hasNotation || hasSummary || hasDescription || hasTechnology || hasTitle
    || hasStyle || hasLinks || hasTags

  if (!hasBody) {
    indent.append(keyword, ' ', kind, NL)
    return
  }

  indent.append(keyword, ' ', kind, ' {', NL)
  indent.indent({
    indentedChildren: inner => {
      if (hasTitle) inner.append('title ', quoteString(elSpec.title!), NL)
      if (hasNotation) inner.append('notation ', quoteString(elSpec.notation!), NL)
      if (hasSummary) inner.append('summary ', quoteMarkdownOrString(elSpec.summary!), NL)
      if (hasDescription) inner.append('description ', quoteMarkdownOrString(elSpec.description!), NL)
      if (hasTechnology) inner.append('technology ', quoteString(elSpec.technology!), NL)
      if (hasTags) inner.append('#', (elSpec.tags as string[]).join(' #'), NL)
      if (hasLinks) {
        for (const link of elSpec.links!) {
          inner.append('link ', link.url)
          if (link.title) inner.append(' ', quoteString(link.title))
          inner.append(NL)
        }
      }
      if (hasStyle) {
        inner.append('style {', NL)
        inner.indent({
          indentedChildren: styleInner => {
            printStyleProperties(elSpec.style!, styleInner)
          },
          indentation: 2,
        })
        inner.append('}', NL)
      }
    },
    indentation: 2,
  })
  indent.append('}', NL)
}

export function elementSpecification(): Op<ElementSpecification> {
  return spaceBetween<ElementSpecification>(
    print('element'),
    property('title', print()),
    body(
      printTags(),
      summaryProperty(),
      descriptionProperty(),
      technologyProperty(),
      notationProperty(),
      styleProperty(),
    ),
  )
}
