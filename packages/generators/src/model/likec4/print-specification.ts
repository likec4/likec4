import type { ThemeColorValues } from '@likec4/core/styles'
import type { ElementSpecification, RelationshipSpecification, TagSpecification } from '@likec4/core/types'
import { entries } from 'remeda'
import { type Op, body, foreach, lines, print, property, select, separateNewLine, spaceBetween, withctx } from './base'
import { styleProperty } from './print-style'
import {
  descriptionProperty,
  linksProperty,
  notationProperty,
  printTags,
  summaryProperty,
  technologyProperty,
  titleProperty,
} from './properties'

interface SpecificationData {
  customColors?: Record<string, ThemeColorValues>
  elements: Record<string, Partial<ElementSpecification>>
  deployments: Record<string, Partial<ElementSpecification>>
  relationships: Record<string, Partial<RelationshipSpecification>>
  tags: Record<string, TagSpecification>
}

export function printSpecification(data: SpecificationData) {
  return body('specification')(
    withctx(data)(
      lines(2)(
        select(
          c => entries(c.elements),
          foreach(
            elementSpecification(),
            separateNewLine(),
          ),
        ),
        select(
          c => entries(c.tags),
          foreach(
            spaceBetween(
              print('tag'),
              property('0'),
            ),
            separateNewLine(),
          ),
        ),
      ),
    ),
  )
}

export function elementSpecification(): Op<[string, Partial<ElementSpecification>]> {
  return spaceBetween(
    print('element'),
    property('0', print()),
    select(
      c => c[1],
      body(
        printTags(),
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
