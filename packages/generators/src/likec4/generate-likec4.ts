import type { Fqn } from '@likec4/core/types'
import { produce } from 'immer'
import { entries, isDeepEqual, isEmptyish, mapValues } from 'remeda'
import { lines, materialize, property, withctx } from './operators/base'
import { modelOp } from './operators/model'
import { specificationOp } from './operators/specification'
import {
  type ElementData,
  type ElementSpecificationData,
  type LikeC4Data,
  type LikeC4DataInput,
  LikeC4DataSchema,
} from './types'

type Params = {
  indentation?: string | number
}

export function generateLikeC4(input: LikeC4DataInput, params?: Params): string {
  params = {
    indentation: 2,
    ...params,
  }
  const data = normalizeStyles(LikeC4DataSchema.parse(input))

  const generateOp = withctx(data)(
    lines(2)(
      property('specification', specificationOp()),
      modelOp(),
    ),
  )

  return materialize(generateOp, params.indentation)
}

function normalizeStyles(data: LikeC4Data): LikeC4Data {
  const elementSpecs = data.specification?.elements
  if (!isEmptyish(elementSpecs) && !isEmptyish(data.elements)) {
    data = {
      ...data,
      elements: mapValues(data.elements, element => normalizeElementStyles(element, elementSpecs)),
    }
  }
  return data
}

function normalizeElementStyles(element: ElementData, specs: Record<string, ElementSpecificationData>): ElementData {
  const spec = specs[element.kind]
  if (!spec) {
    return element
  }
  const specStyle = spec.style ?? {}
  return produce(element, draft => {
    for (
      // Remove properties that are the same as the specification
      const key of [
        'description',
        'technology',
        'title',
        'tags',
        'summary',
      ] satisfies (keyof ElementSpecificationData)[]
    ) {
      const specValue = spec[key]
      const elementValue = element[key]
      if (isDeepEqual(specValue, elementValue)) {
        delete draft[key]
      }
    }
    if (!element.style) {
      return
    }
    // Remove style properties that are the same as the specification
    for (const [key, value] of entries(specStyle)) {
      if (isDeepEqual(element.style?.[key], value)) {
        delete draft.style![key]
      }
    }
  })
}
