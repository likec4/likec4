import { LikeC4Styles } from '@likec4/core/styles'
import { useContext, useEffect, useState } from 'react'
import { LikeC4ModelContext } from './LikeC4ModelContext'

export function useLikeC4Styles(): LikeC4Styles {
  const model = useContext(LikeC4ModelContext)
  if (!model) {
    console.error('No LikeC4ModelContext found')
  }
  const $styles = model?.$styles ?? LikeC4Styles.DEFAULT

  const [styles, setStyles] = useState($styles)

  useEffect(() => {
    setStyles(current => current.equals($styles) ? current : $styles)
  }, [$styles])

  return styles
}
