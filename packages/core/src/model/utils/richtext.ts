import type { Any, RichTextOrEmpty } from '../../types'
import { RichText } from '../../types/RichText'
import type { MarkdownOrString } from '../../types/scalar'
import { memoizeProp } from '../../utils/memoize-prop'
import type { LikeC4DeploymentModel } from '../DeploymentModel'
import type { LikeC4Model } from '../LikeC4Model'

type WithModel<A extends Any> = { readonly $model: LikeC4Model<A> } | { readonly $model: LikeC4DeploymentModel<A> }

/**
 * Memoizes a rich text property on an object.
 *
 * @param obj - The object to memoize the property on.
 * @param tag - The symbol or string to use as the property key.
 * @param source - The markdown or string to convert to rich text.
 * @returns The memoized rich text or empty rich text.
 */
export function memoizeRichText<A extends Any>(
  obj: WithModel<A>,
  tag: symbol | string,
  source: MarkdownOrString | null | undefined,
): RichTextOrEmpty {
  return memoizeProp(obj, tag, () => RichText.from(source, obj.$model.resolveMarkdownRef))
}

const DescriptionTag = Symbol.for('rich-description')

/**
 * Memoizes the description property on an object.
 *
 * @param obj - The object to memoize the property on.
 * @param source - The markdown or string to convert to rich text.
 * @returns The memoized rich text or empty rich text.
 */
export function memoizeDescription<A extends Any>(
  obj: WithModel<A>,
  source: MarkdownOrString | null | undefined,
): RichTextOrEmpty {
  return memoizeProp(obj, DescriptionTag, () => RichText.from(source, obj.$model.resolveMarkdownRef))
}

const SummaryTag = Symbol.for('rich-summary')

/**
 * Memoizes the summary property on an object.
 *
 * @param obj - The object to memoize the property on.
 * @param source - The markdown or string to convert to rich text.
 * @returns The memoized rich text or empty rich text.
 */
export function memoizeSummary<A extends Any>(
  obj: WithModel<A>,
  source: MarkdownOrString | null | undefined,
): RichTextOrEmpty {
  return memoizeProp(obj, SummaryTag, () => RichText.from(source, obj.$model.resolveMarkdownRef))
}
