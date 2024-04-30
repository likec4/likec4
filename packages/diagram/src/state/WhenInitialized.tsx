import { type PropsWithChildren, useEffect, useState } from 'react'
import { useDiagramStoreApi } from './useDiagramStore'

export function WhenInitialized({ children }: PropsWithChildren) {
  const diagramApi = useDiagramStoreApi()

  const [isInitialized, setIsInitialized] = useState(diagramApi.getState().initialized)

  useEffect(() => {
    if (isInitialized) {
      return
    }
    return diagramApi.subscribe(
      s => s.initialized,
      setIsInitialized
    )
  }, [isInitialized])

  if (!isInitialized) {
    return null
  }

  return <>{children}</>
}
