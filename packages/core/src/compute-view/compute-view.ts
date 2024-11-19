import { values } from 'remeda'
import { type ComputedView, isDeploymentView, isElementView, type LikeC4View, type ParsedLikeC4Model } from '../types'
import { DeploymentViewComputeCtx } from './deployment-view/compute'
import { DynamicViewComputeCtx } from './dynamic-view/compute'
import { ComputeCtx } from './element-view/compute'
import { LikeC4DeploymentGraph } from './LikeC4DeploymentGraph'
import { LikeC4ModelGraph } from './LikeC4ModelGraph'

type ComputeViewResult =
  | {
    isSuccess: true
    view: ComputedView
  }
  | {
    isSuccess: false
    error: Error
    view: undefined
  }

// export function computeView(view: ElementView, graph: LikeC4ModelGraph): ComputeViewResult {
//   try {
//     return {
//       isSuccess: true,
//       view: computeElementView(view, graph)
//     }
//   } catch (e) {
//     return {
//       isSuccess: false,
//       error: e instanceof Error ? e : new Error(`Unknown error: ${e}`),
//       view: undefined
//     }
//   }
// }

export function prepareComputeView(model: ParsedLikeC4Model) {
  const index = new LikeC4ModelGraph(model)
  let deploymentGraph

  // function computeView(view: ElementView): ComputedElementView
  // // function computeView(view: DynamicView): ComputedDynamicView
  // // function computeView(view: DeploymentView): ComputedDeploymentView
  // function computeView(view: LikeC4View): ComputedView {

  // }

  return (viewsource: LikeC4View): ComputeViewResult => {
    try {
      let view
      switch (true) {
        case isElementView(viewsource):
          view = ComputeCtx.elementView(viewsource, index)
          break
        case isDeploymentView(viewsource): {
          deploymentGraph ??= new LikeC4DeploymentGraph({
            elements: values(model.deployments.elements),
            modelGraph: index
          })
          view = DeploymentViewComputeCtx.compute(viewsource, deploymentGraph)
          break
        }
        default:
          view = DynamicViewComputeCtx.compute(viewsource, index)
          break
      }
      return {
        isSuccess: true,
        view
      }
    } catch (e) {
      return {
        isSuccess: false,
        error: e instanceof Error ? e : new Error(`Unknown error: ${e}`),
        view: undefined
      }
    }
  }
}
