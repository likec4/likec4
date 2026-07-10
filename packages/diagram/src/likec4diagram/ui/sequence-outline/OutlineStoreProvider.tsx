import { type DynamicViewFlow, type StepPath } from '@likec4/core'
import { type PropsWithChildren, useEffect, useState } from 'react'

import { useStore } from '@xstate/store-react'
import { useUpdateEffect } from '../../../hooks/useUpdateEffect'
import { OutlineStoreContext } from './hooks'
import { outlineStore } from './state'

export const OutlineStoreProvider = (
  { children, ...input }: PropsWithChildren<{
    flow: DynamicViewFlow
    activeStep: StepPath
  }>,
) => {
  const store = useStore(outlineStore, input)

  const { flow, activeStep } = input

  useUpdateEffect(() => {
    store.trigger.updateFlow({ flow })
  }, [flow])

  // useUpdateEffect(() => {
  //   store.trigger.changeActiveStep({ step: activeStep })
  // }, [activeStep])

  return (
    <OutlineStoreContext.Provider value={store}>
      {children}
    </OutlineStoreContext.Provider>
  )
}
