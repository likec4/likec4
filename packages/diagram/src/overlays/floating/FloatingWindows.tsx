import { useAtom } from '@xstate/store-react'
import { shallowEqual } from 'fast-equals'
import { AnimatePresence } from 'motion/react'
import { useMemo } from 'react'
import { PortalToContainer } from '../../custom'
import { FloatingWindowStoreProvider } from './hooks'
import { type WindowId, createFloatingWindowStore } from './store'
import { ViewDescriptionFloatingWindow } from './ViewDescriptionWindow'

export function FloatingWindows() {
  const [store, visible] = useMemo(() => {
    const store = createFloatingWindowStore({
      initial: [
        {
          id: '123' as WindowId,
          visible: true,
          pos: { top: 100, left: 100 },
        },
      ],
      sideEffects: {
        onElementStateClick({ id }) {
          // actorRef.send({ type: 'toggle.element', id })
        },
      },
    })
    return [store, store.select(s => s.visible, shallowEqual)]
  }, [])

  const visibleWindows = useAtom(visible)

  return (
    <FloatingWindowStoreProvider value={store}>
      <PortalToContainer>
        <AnimatePresence>
          {visibleWindows.map(id => <ViewDescriptionFloatingWindow key={id} id={id} />)}
        </AnimatePresence>
      </PortalToContainer>
    </FloatingWindowStoreProvider>
  )
}
