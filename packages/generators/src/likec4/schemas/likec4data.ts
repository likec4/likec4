import { LikeC4StylesConfigSchema } from '@likec4/config'
import { produce } from 'immer'
import { entries, isDeepEqual, isEmptyish, mapValues } from 'remeda'
import * as z from 'zod/v4'
import * as deployment from './deployment'
import * as model from './model'
import * as specification from './specification'
import { views } from './views'

const likec4dataPreTransform = z
  .object({
    ...model.schema.shape,
    views: views,
    project: z.object({
      id: z.string(),
      styles: LikeC4StylesConfigSchema.nullish(),
    }),
    deployment: deployment.schema,
    deployments: deployment.schema,
    specification: specification.schema,
  })
  .partial()
  .readonly()

export const likec4data = likec4dataPreTransform.transform(normalizeStyles)

type LikeC4Data = z.output<typeof likec4dataPreTransform>
type ElementData = z.output<typeof model.element>
type ElementSpecificationData = z.output<typeof specification.element>

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
