import { LikeC4Styles } from '@likec4/core/styles'
import { useOptionalLikeC4Model } from '../context/LikeC4ModelContext'

export function useLikeC4Styles(): LikeC4Styles {
  const model = useOptionalLikeC4Model()
  return model?.$styles ?? LikeC4Styles.DEFAULT
}
