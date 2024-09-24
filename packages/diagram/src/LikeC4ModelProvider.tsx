import { LikeC4Model } from '@likec4/core'
import { useCustomCompareMemo } from '@react-hookz/web'
import { type PropsWithChildren } from 'react'
import type { RequireExactlyOne } from 'type-fest'
import { depsShallowEqual } from './hooks/useUpdateEffect'
import { LikeC4ModelContext } from './likec4model/LikeC4ModelContext'
import { useLikeC4Model } from './likec4model/useLikeC4Model'

export type LikeC4ModelProviderProps = PropsWithChildren<
  RequireExactlyOne<{
    likec4model: LikeC4Model
    layouted: LikeC4Model.Layouted.SourceModel
    computed: LikeC4Model.Computed.SourceModel
  }>
>

/**
 * Ensures LikeC4Model context
 */
export function LikeC4ModelProvider({
  children,
  ...props
}: LikeC4ModelProviderProps) {
  const model = useLikeC4Model()

  if (model) {
    return <>{children}</>
  }

  const value = useCustomCompareMemo(
    () => {
      if (props.likec4model) {
        return props.likec4model
      }
      if (props.layouted) {
        return LikeC4Model.layouted(props.layouted)
      }
      return LikeC4Model.computed(props.computed)
    },
    [props.likec4model ?? props.layouted ?? props.computed],
    depsShallowEqual
  )

  return (
    <LikeC4ModelContext.Provider value={value}>
      {children}
    </LikeC4ModelContext.Provider>
  )
}
