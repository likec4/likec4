import { LikeC4Model } from '@likec4/core/model'
import { type aux, type LayoutedLikeC4ModelData, _stage } from '@likec4/core/types'
import { invariant } from '@likec4/core/utils'
import { mapToObj } from 'remeda'
import { QueueGraphvizLayoter } from './QueueGraphvizLayoter'

export async function layoutModel<A extends aux.Any>(
  model: LikeC4Model<A>,
  options?: ConstructorParameters<typeof QueueGraphvizLayoter>[0],
): Promise<LikeC4Model.Layouted<A>> {
  if (model.isLayouted()) {
    return Promise.resolve(model.asLayouted)
  }
  invariant(model.isComputed(), 'Model is not computed')
  const layouter = new QueueGraphvizLayoter(options)
  const specification = model.specification
  const layoutResult = await layouter.batchLayout({
    batch: [...model.asComputed.views()].map(view => ({
      view: view.$view,
      specification,
    })),
  })
  return LikeC4Model.create({
    ...model.asLayouted.$data,
    [_stage]: 'layouted',
    views: mapToObj(layoutResult, ({ diagram }) => [diagram.id, diagram]),
  } as LayoutedLikeC4ModelData<A>)
}
