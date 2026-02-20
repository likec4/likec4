import type { ThemeColorValues } from '@likec4/core/styles'
import type { ElementSpecification, RelationshipSpecification, TagSpecification } from '@likec4/core/types'
import { entries } from 'remeda'
import {
  type AnyOp,
  type Op,
  body,
  foreachNewLine,
  lines,
  print,
  property,
  select,
  spaceBetween,
  withctx,
} from './base'
import { colorProperty, styleProperty } from './print-style'
import {
  descriptionProperty,
  enumProperty,
  linksProperty,
  notationProperty,
  summaryProperty,
  tagsProperty,
  technologyProperty,
  titleProperty,
} from './properties'

interface SpecificationData {
  customColors?: Record<string, ThemeColorValues>
  elements: Record<string, Partial<ElementSpecification>>
  deployments: Record<string, Partial<ElementSpecification>>
  relationships: Record<string, Partial<RelationshipSpecification>>
  tags: Record<string, Partial<TagSpecification>>
}

export function printSpecification(data: SpecificationData): AnyOp {
  return body('specification')(
    withctx(data)(
      lines(2)(
        select(
          c => entries(c.elements),
          foreachNewLine(
            elementSpecification(),
          ),
        ),
        select(
          c => entries(c.relationships),
          foreachNewLine(
            relationshipSpecification(),
          ),
        ),
        select(
          c => entries(c.tags),
          foreachNewLine(
            tagSpecification(),
          ),
        ),
      ),
    ),
  )
}

export function tagSpecification(): Op<[string, Partial<TagSpecification>]> {
  return spaceBetween(
    print('tag'),
    property('0', print()),
    // property('1', body(printTags())),
  )
}

export function elementSpecification(): Op<[string, Partial<ElementSpecification>]> {
  return spaceBetween(
    print('element'),
    property('0'),
    property(
      '1',
      body(
        tagsProperty(),
        titleProperty(),
        summaryProperty(),
        descriptionProperty(),
        technologyProperty(),
        notationProperty(),
        linksProperty(),
        styleProperty(),
      ),
    ),
  )
}

export function relationshipSpecification(): Op<[string, Partial<RelationshipSpecification>]> {
  return spaceBetween(
    print('relationship'),
    property('0'),
    property(
      '1',
      body(
        technologyProperty(),
        notationProperty(),
        body('style')(
          colorProperty(),
          enumProperty('line'),
          enumProperty('head'),
          enumProperty('tail'),
        ),
      ),
    ),
    // property('1', body(printTags())),
  )
}
