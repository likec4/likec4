import { LikeC4Model as Model } from '@likec4/core'
import { LikeC4ModelProvider } from '@likec4/diagram'
import { type PropsWithChildren, useEffect, useState } from 'react'
import { likec4ModelSource } from 'virtual:likec4/model'

export function LikeC4Model({ children }: PropsWithChildren) {
  const [model, setModel] = useState(() => Model.layouted(likec4ModelSource))

  useEffect(() => {
    setModel(Model.layouted(likec4ModelSource))
  }, [likec4ModelSource])

  return (
    <LikeC4ModelProvider likec4model={model}>
      {children}
    </LikeC4ModelProvider>
  )
}
