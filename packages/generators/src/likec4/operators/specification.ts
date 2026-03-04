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
  printProperty,
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

export function specificationOp<A extends SpecificationData>(): Op<A> {
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
    printProperty('0'),
    property(
      '1',
      property(
        'color',
        body(
          spaceBetween(
            print('color'),
            print(),
          ),
        ),
      ),
    ),
  )
}

export function elementSpecification<A extends ElementSpecificationData>(): Op<[string, A]> {
  return spaceBetween(
    print('element'),
    printProperty('0'),
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

export function relationshipSpecification<A extends RelationshipSpecificationData>(): Op<[string, A]> {
  return spaceBetween(
    print('relationship'),
    printProperty('0'),
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
