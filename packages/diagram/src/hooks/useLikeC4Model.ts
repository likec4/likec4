import type { LikeC4Model, LikeC4ViewModel } from '@likec4/core/model'
import type * as t from '@likec4/core/types'
import { deepEqual } from 'fast-equals'
import { useEffect, useState } from 'react'
import { useOptionalLikeC4Model } from '../context/LikeC4ModelContext'

type Any = t.aux.Any

export {
  useOptionalLikeC4Model,
}

/**
 * @returns The LikeC4Model from context.
 * @throws If no LikeC4ModelProvider is found.
 */
export function useLikeC4Model<A extends Any = t.aux.UnknownLayouted>(): LikeC4Model<A> {
  const model = useOptionalLikeC4Model<A>()
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
  const _specification = model.specification

  const [specification, setSpecification] = useState(_specification)

  useEffect(() => {
    setSpecification(current => deepEqual(current, _specification) ? current : _specification)
  }, [_specification])

  return specification
}
