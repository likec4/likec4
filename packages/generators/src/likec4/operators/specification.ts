import { entries } from 'remeda'
import * as z from 'zod/v4'
import * as schemas from '../schemas/specification'
import {
  body,
  foreachNewLine,
  lines,
  print,
  printProperty,
  property,
  select,
  spaceBetween,
  zodOp,
} from './base'
import {
  colorProperty,
  descriptionProperty,
  linksProperty,
  notationProperty,
  styleProperties,
  summaryProperty,
  tagsProperty,
  technologyProperty,
  titleProperty,
} from './properties'

export const tagSpecification = zodOp(z.tuple([z.string(), schemas.tagSpec]))(
  spaceBetween(
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
  ),
)

export const elementKind = (keyword: 'element' | 'deploymentNode') =>
  zodOp(z.tuple([z.string(), schemas.element]))(
    spaceBetween(
      print(keyword),
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
    ),
  )

export const relationshipKind = zodOp(z.tuple([z.string(), schemas.relationship]))(
  spaceBetween(
    print('relationship'),
    printProperty('0'),
    property(
      '1',
      body(
        technologyProperty(),
        notationProperty(),
        colorProperty(),
        property('line'),
        property('head'),
        property('tail'),
      ),
    ),
  ),
)

export const specification = zodOp(schemas.schema)(
  body('specification')(
    lines(2)(
      select(
        c => c.elements && entries(c.elements),
        foreachNewLine(
          elementKind('element')(),
        ),
      ),
      select(
        c => c.deployments && entries(c.deployments),
        foreachNewLine(
          elementKind('deploymentNode')(),
        ),
      ),
      select(
        c => c.relationships && entries(c.relationships),
        foreachNewLine(
          relationshipKind(),
        ),
      ),
      select(
        c => c.tags && entries(c.tags),
        foreachNewLine(
          tagSpecification(),
        ),
      ),
    ),
  ),
)
