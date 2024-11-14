import { ActionIcon, Box, FocusTrap, RemoveScroll } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { IconX } from '@tabler/icons-react'
import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import { AnimatePresence, m } from 'framer-motion'
import { memo, type PropsWithChildren, useEffect, useMemo, useRef } from 'react'
import { isNullish } from 'remeda'
import { type DiagramState, useDiagramState, useDiagramStoreApi } from '../hooks/useDiagramState'
import { EdgeDetailsXYFlow } from './edge-details/EdgeDetailsXYFlow'
import { ElementDetailsCard } from './element-details/ElementDetailsCard'
import { OverlayContext, useOverlayDialog } from './OverlayContext'
import * as css from './Overlays.css'
import { RelationshipsOverlay } from './relationships-of/RelationshipsOverlay'

export const Overlays = memo(() => {
  const diagramStore = useDiagramStoreApi()
  const {
    activeOverlay,
    viewId
  } = useDiagramState(s => ({
    activeOverlay: s.activeOverlay,
    viewId: s.view.id
  }))

  const onCloseCbRef = useRef<(() => void)>()

  const ctxValue = useMemo(() => ({
    openOverlay: ((overlay) => {
      diagramStore.getState().openOverlay(overlay)
    }) as DiagramState['openOverlay'],
    close: (cb?: () => void) => {
      onCloseCbRef.current = cb
      diagramStore.getState().closeOverlay()
    }
  }), [diagramStore])

  const onExitComplete = () => {
    onCloseCbRef.current?.()
    onCloseCbRef.current = undefined
  }

  const isActive = !!activeOverlay
  useHotkeys(
    isActive
      ? [
        ['Escape', (e) => {
          e.stopPropagation()
          ctxValue.close()
        }, { preventDefault: true }]
      ]
      : []
  )

  return (
    <OverlayContext.Provider value={ctxValue}>
      <AnimatePresence initial={false} key={viewId} onExitComplete={onExitComplete}>
        {activeOverlay?.elementDetails && (
          <ElementDetailsCard key={'details card'} fqn={activeOverlay.elementDetails} />
        )}
      </AnimatePresence>
      <AnimatePresence initial={false} onExitComplete={onExitComplete}>
        {activeOverlay && isNullish(activeOverlay.elementDetails) && (
          <Box
            component={m.div}
            className={css.container}
            data-likec4-color="gray"
            initial={{
              '--backdrop-blur': '0px',
              '--backdrop-opacity': '60%',
              opacity: 0,
              translateY: -15
            }}
            animate={{
              '--backdrop-blur': '10px',
              '--backdrop-opacity': '25%',
              opacity: 1,
              translateY: 0
            }}
            exit={{
              '--backdrop-blur': '1px',
              '--backdrop-opacity': '90%',
              translateY: -5,
              opacity: 0,
              transition: {
                duration: .2
              }
            }}
          >
            <RemoveScroll>
              <FocusTrap>
                {activeOverlay.relationshipsOf && <RelationshipsOverlay subjectId={activeOverlay.relationshipsOf} />}
                {activeOverlay.edgeDetails && (
                  <XYFlowProvider
                    defaultNodes={[]}
                    defaultEdges={[]}>
                    <EdgeDetailsXYFlow edgeId={activeOverlay.edgeDetails} />
                  </XYFlowProvider>
                )}
                <Box pos={'absolute'} top={'1rem'} right={'1rem'}>
                  <ActionIcon
                    variant="default"
                    // color="gray"
                    size={'lg'}
                    // data-autofocus
                    // autoFocus
                    onClick={(e) => {
                      e.stopPropagation()
                      ctxValue.close()
                    }}>
                    <IconX />
                  </ActionIcon>
                </Box>
              </FocusTrap>
            </RemoveScroll>
          </Box>
        )}
      </AnimatePresence>
    </OverlayContext.Provider>
  )
})

// const OverlayDialogCloseButton = () => {
//   const { close } = useOverlayDialog()
//   return (
//     <Box pos={'absolute'} top={'1rem'} right={'1rem'}>
//       <ActionIcon
//         variant="default"
//         // color="gray"
//         size={'lg'}
//         autoFocus
//         onClick={(e) => {
//           e.stopPropagation()
//           close()
//         }}>
//         <IconX />
//       </ActionIcon>
//     </Box>
//   )
// }

// type OverlayDialogProps = Pick<HTMLAttributes<HTMLDialogElement>, 'style' | 'className'> & {
//   onClose?: (() => void) | undefined
//   children: (renderProps: {
//     opened: boolean
//     close: () => void
//   }) => ReactNode
// }

// const OverlayDialog = forwardRef<HTMLDialogElement, OverlayDialogProps>(({
//   className,
//   children,
//   onClose,
//   ...props
// }, forwardedRef) => {
//   const onCloseRef = useSyncedRef(onClose)
//   const api = useDiagramStoreApi()
//   const [opened, setOpened] = useState(false)
//   const dialogRef = useRef<HTMLDialogElement>(null)
//   const ref = useMergedRef(dialogRef, forwardedRef)

//   // useDebouncedEffect(
//   //   () => {
//   //     dialogRef.current?.showModal()
//   //   },
//   //   [],
//   //   30
//   // )

//   useDebouncedEffect(
//     () => {
//       setOpened(true)
//     },
//     [],
//     80
//   )

//   const { start: triggerOnClose } = useTimeout(() => {
//     onCloseRef.current?.()
//   }, 300)

//   const ctxValue = useMemo(() => ({
//     openOverlay: api.getState().openOverlay,
//     close: () => {
//       dialogRef.current?.close()
//     }
//   }), [api])

//   return (
//     <OverlayContext.Provider value={ctxValue}>
//       <div
//         aria-modal="true"
//         ref={ref}
//         className={clsx(css.dialog, className)}
//         onClick={e => {
//           if ((e.target as any)?.nodeName?.toUpperCase() === 'DIALOG') {
//             e.stopPropagation()
//             dialogRef.current?.close()
//           }
//         }}
//         onClose={e => {
//           e.stopPropagation()
//           triggerOnClose()
//         }}
//         {...props}
//       >
//         {children({
//           opened,
//           ...ctxValue
//         })}
//       </div>
//     </OverlayContext.Provider>
//   )
// })

// const OverlayDialogCloseButton = () => {
//   const { close } = useOverlayDialog()
//   return (
//     <Box pos={'absolute'} top={'1rem'} right={'1rem'}>
//       <ActionIcon
//         variant="default"
//         // color="gray"
//         size={'lg'}
//         autoFocus
//         onClick={(e) => {
//           e.stopPropagation()
//           close()
//         }}>
//         <IconX />
//       </ActionIcon>
//     </Box>
//   )
// }
const OverlayDialog = ({ children }: PropsWithChildren) => {
  const overlay = useOverlayDialog()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])
  return (
    <m.dialog
      ref={ref}
      exit={{
        opacity: 0,
        transition: {
          duration: .15
        }
      }}
      onClick={e => {
        if ((e.target as any)?.nodeName?.toUpperCase() === 'DIALOG') {
          e.stopPropagation()
          ref.current?.close()
        }
      }}
      onClose={e => {
        e.stopPropagation()
        overlay.close()
      }}
    >
      {children}
    </m.dialog>
  )
}
