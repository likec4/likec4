import type { aux, LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import { deepEqual } from 'fast-equals'
import { useContext, useEffect, useState } from 'react'
import { LikeC4ModelContext } from './LikeC4ModelContext'

export function useLikeC4Model<A extends aux.Any = aux.UnknownLayouted>(): LikeC4Model<A> {
  const model = useContext(LikeC4ModelContext)
  if (!model) {
    throw new Error('LikeC4Model not found. Make sure you have LikeC4ModelProvider.')
  }
  return model
}

export function useLikeC4ViewModel<A extends aux.Any = aux.UnknownLayouted>(
  viewId: aux.ViewId<A>,
): LikeC4ViewModel<A> {
  const model = useLikeC4Model<A>()
  // const [view, setView] = useState(() => model.findView(viewId))
  // useEffect(() => {
  //   setView(model.findView(viewId))
  // }, [model, viewId])
  return model.view(viewId)
}

export function useLikeC4Specification() {
  const model = useLikeC4Model()
  const [specification, setSpecification] = useState(model.$data.specification)
  useEffect(() => {
    setSpecification(current => deepEqual(current, model.$data.specification) ? current : model.$data.specification)
  }, [model])
  return specification
}
