import type { LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import type * as t from '@likec4/core/types'
import { deepEqual } from 'fast-equals'
import { useContext, useEffect, useState } from 'react'
import { LikeC4ModelContext } from '../context/LikeC4ModelContext'

type Any = t.aux.Any

export function useOptionalLikeC4Model<A extends Any = t.aux.UnknownLayouted>(): LikeC4Model<A> | null {
  return useContext(LikeC4ModelContext)
}

export function useLikeC4Model<A extends Any = t.aux.UnknownLayouted>(): LikeC4Model<A> {
  const model = useContext(LikeC4ModelContext)
  if (!model) {
    throw new Error('LikeC4Model not found. Make sure you have LikeC4ModelProvider.')
  }
  return model
}

export function useLikeC4ViewModel<A extends Any = t.aux.UnknownLayouted>(
  viewId: t.aux.ViewId<A>,
): LikeC4ViewModel<A> {
  const model = useLikeC4Model<A>()
  return model.view(viewId)
}

export function useLikeC4Specification(): t.Specification<t.aux.UnknownLayouted> {
  const model = useLikeC4Model()
  const [specification, setSpecification] = useState(model.specification)
  useEffect(() => {
    setSpecification(current => deepEqual(current, model.specification) ? current : model.specification)
  }, [model])
  return specification
}
