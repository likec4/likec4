import { LikeC4Model } from '@likec4/core/model'
import type { Any } from '@likec4/core/types'
import { _stage } from '@likec4/core/types'
import { invariant } from '@likec4/core/utils'
import { mapToObj, mapValues } from 'remeda'
import { QueueGraphvizLayoter } from './QueueGraphvizLayoter'

/**
 * Layouts all views in the computed model.
 * @param model - The model to layout.
 * @param options - Options for th2 layouter.
 * @returns A promise that resolves to the layouted model.
 */
export async function layoutLikeC4Model<A extends Any>(
  model: LikeC4Model<A>,
  options?: ConstructorParameters<typeof QueueGraphvizLayoter>[0],
): Promise<LikeC4Model.Layouted<A>> {
  if (model.isLayouted()) {
    return Promise.resolve(model.asLayouted)
  }
  invariant(model.isComputed(), 'Model is not computed')
  const layouter = new QueueGraphvizLayoter(options)
  const styles = model.$styles
  const layoutResult = await layouter.batchLayout({
    batch: [...model.asComputed.views()].map(view => ({
      view: view.$view,
      styles,
    })),
  })
  // A story owns no geometry (see RFC 0001, "Layout"): "layouting" a story is just
  // relabeling its stage, no Graphviz call needed.
  const layoutedStories = mapValues(
    model.asComputed.$data.stories,
    (story) => ({ ...story, [_stage]: 'layouted' as const }),
  )
  return LikeC4Model.create({
    ...model.asLayouted.$data,
    [_stage]: 'layouted',
    views: mapToObj(layoutResult, ({ diagram }) => [diagram.id, diagram]),
    stories: layoutedStories,
  }) as any
}
