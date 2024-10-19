import { ActionIcon, Box, FocusTrap } from '@mantine/core'
import { useHotkeys } from '@mantine/hooks'
import { IconX } from '@tabler/icons-react'
import { ReactFlowProvider as XYFlowProvider } from '@xyflow/react'
import { AnimatePresence, m } from 'framer-motion'
import { memo, useMemo } from 'react'
import { type DiagramState, useDiagramState, useDiagramStoreApi } from '../hooks/useDiagramState'
import { EdgeDetailsXYFlow } from './edge-details/EdgeDetailsXYFlow'
import { OverlayContext } from './OverlayContext'
import * as css from './Overlays.css'
import { RelationshipsXYFlow } from './relationships-of/RelationshipsXYFlow'
export const Overlays = memo(() => {
  const diagramStore = useDiagramStoreApi()
  const activeOverlay = useDiagramState(s => s.activeOverlay)

  const ctxValue = useMemo(() => ({
    openOverlay: ((overlay) => {
      diagramStore.getState().openOverlay(overlay)
    }) as DiagramState['openOverlay'],
    close: () => {
      diagramStore.getState().closeOverlay()
    }
  }), [diagramStore])

  const isActive = !!activeOverlay
  useHotkeys(
    isActive
      ? [
        ['Escape', (e) => {
          e.stopImmediatePropagation()
          diagramStore.getState().closeOverlay()
        }, { preventDefault: true }]
      ]
      : []
  )
  return (
    <OverlayContext.Provider value={ctxValue}>
      <AnimatePresence>
        {activeOverlay && (
          <Box
            component={m.div}
            className={css.container}
            data-likec4-color="gray"
            initial={{
              '--backdrop-blur': '0px',
              '--backdrop-opacity': '60%',
              opacity: 0,
              translateY: -20
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
              opacity: 0
            }}
          >
            <FocusTrap>
              {activeOverlay.relationshipsOf && (
                <XYFlowProvider
                  defaultNodes={[]}
                  defaultEdges={[]}>
                  <RelationshipsXYFlow subjectId={activeOverlay.relationshipsOf} />
                </XYFlowProvider>
              )}
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
                  data-autofocus
                  autoFocus
                  onClick={(e) => {
                    e.stopPropagation()
                    ctxValue.close()
                  }}>
                  <IconX />
                </ActionIcon>
              </Box>
            </FocusTrap>
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
