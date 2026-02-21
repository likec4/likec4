import type {
  Tag,
} from '@likec4/core/types'
import { entries } from 'remeda'
import type {
  ElementSpecificationData,
  RelationshipSpecificationData,
  SpecificationData,
} from '../types'
import {
  type Op,
  body,
  foreachNewLine,
  lines,
  print,
  property,
  select,
  spaceBetween,
} from './base'
import {
  colorProperty,
  descriptionProperty,
  enumProperty,
  linksProperty,
  notationProperty,
  styleProperties,
  summaryProperty,
  tagsProperty,
  technologyProperty,
  titleProperty,
} from './properties'

export function specificationOp(): Op<SpecificationData> {
  return body('specification')(
    lines(2)(
      select(
        c => c.elements && entries(c.elements),
        foreachNewLine(
          elementSpecification(),
        ),
      ),
      select(
        c => c.relationships && entries(c.relationships),
        foreachNewLine(
          relationshipSpecification(),
        ),
      ),
      select(
        c => c.tags && entries(c.tags),
        foreachNewLine(
          tagSpecification(),
        ),
      ),
    ),
  )
}

export function tagSpecification(): Op<[Tag, { color?: string | undefined }]> {
  return spaceBetween(
    print('tag'),
    property('0'),
    select(
      v => v[1].color,
      body<string>(
        spaceBetween(
          print('color'),
          print(),
        ),
      ),
    ),
  )
}

export function elementSpecification(): Op<[string, ElementSpecificationData]> {
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
        property(
          'style',
          body('style')(
            styleProperties(),
          ),
        ),
      ),
    ),
  )
}

export function relationshipSpecification(): Op<[string, RelationshipSpecificationData]> {
  return spaceBetween(
    print('relationship'),
    property('0'),
    property(
      '1',
      body(
        technologyProperty(),
        notationProperty(),
        colorProperty(),
        enumProperty('line'),
        enumProperty('head'),
        enumProperty('tail'),
      ),
    ),
  )
}
