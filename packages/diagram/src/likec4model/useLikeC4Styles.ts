import { type LikeC4StyleConfig, defaultStyle } from '@likec4/core'
import { deepEqual } from 'fast-equals'
import { useContext, useEffect, useState } from 'react'
import { LikeC4ModelContext } from './LikeC4ModelContext'

export function useLikeC4Styles(): LikeC4StyleConfig {
  const model = useContext(LikeC4ModelContext)
  if (!model) {
    console.error('No LikeC4ModelContext found')
  }
  const $styles = model?.$styles ?? defaultStyle

  const [styles, setStyles] = useState($styles)

  useEffect(() => {
    setStyles(current => deepEqual(current, $styles) ? current : $styles)
  }, [$styles])

  return styles
}
