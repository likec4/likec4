import { css, cx } from '@likec4/styles/css'
import { Box, createStyleContext, HStack, isCssProperty } from '@likec4/styles/jsx'
import { floatingWindow } from '@likec4/styles/recipes'
import { CloseButton, ScrollAreaAutosize } from '@mantine/core'
import {
  type HTMLMotionProps,
  isValidMotionProp,
  m,
  useAnimate,
  useDragControls,
  useMotionValue,
  usePresence,
  useTransform,
} from 'motion/react'
import { type PropsWithChildren, forwardRef, useEffect, useState } from 'react'
import { clamp } from 'remeda'
import { useRootContainerRef } from '../context'
import { roundDpr } from '../utils'

const { withRootProvider, withProvider, withContext } = createStyleContext(floatingWindow)

const shouldForwardProp = (prop: string, variantKeys: string[]): boolean =>
  !variantKeys.includes(prop) && (isValidMotionProp(prop) || !isCssProperty(prop))

const Root = withProvider(m.div, 'root', {
  shouldForwardProp,
})

type HeaderProps = HTMLMotionProps<'div'> & {
  children?: React.ReactNode
  onMinimize?: () => void
  onClose?: () => void
}
const Header = withContext(
  // forwardRef<HTMLDivElement, HeaderProps>(({ children, onMinimize, onClose, ...props }, ref) => {
  //   return (
  //     <m.div
  //       ref={ref}
  //       {...props}
  //     >
  //       {children}
  //       {onMinimize && <button onClick={onMinimize}>Minimize</button>}
  //       {onClose && <button onClick={onClose}>Close</button>}
  //     </m.div>
  //   )
  // }),
  m.div,
  'header',
  { shouldForwardProp },
)

const Content = withContext('div', 'content', {
  shouldForwardProp,
})

const ResizeHandler = withContext(m.div, 'resizeHandler', {
  shouldForwardProp,
})

export type WindowPosition = { top: number; left: number }

export type FloatingWindowProps = PropsWithChildren<{
  header?: React.ReactNode
  position: WindowPosition
  width?: number
  height?: number
  onPositionChange: (position: WindowPosition) => void
  onResize?: (width: number, height: number) => void
  onMinimize?: () => void
  onClose?: () => void
}>

export function FloatingWindow({
  position,
  width: inWidth = 0,
  height: inHeight = 0,
  children,
  onPositionChange,
  onResize,
  onClose,
  onMinimize,
  header,
}: FloatingWindowProps) {
  const rootRef = useRootContainerRef()
  // const pos = store.get().context.pos
  const [ref, animate] = useAnimate<HTMLDivElement>()
  const [isDragging, setIsDragging] = useState(false)
  // const state = useAtom(useMemo(() => store.select(prop('state')), [store]))
  const varWidth = useMotionValue(inWidth)
  const varHeight = useMotionValue(inHeight)
  const width = useTransform(varWidth, (w) => w === 0 ? 'auto' : `${w}px`)
  const height = useTransform(varHeight, (h) => h === 0 ? 'auto' : `${h}px`)
  // const [isPresent, safeToRemove] = usePresence()

  // useEffect(() => {
  //   if (isPresent) {
  //     const show = async () => {
  //       await animate(ref.current, {
  //         opacity: 1,
  //         scale: 1,
  //       })
  //     }
  //     show()
  //     return
  //   }

  //   const hide = async () => {
  //     await animate(ref.current, {
  //       opacity: 0,
  //       scale: 0.9,
  //     })
  //     safeToRemove()
  //   }
  //   hide()
  // }, [isPresent])

  // const { closeWindow } = useStore().trigger
  // const window = useStore(s => s.windows[id], deepEqual)
  // if (!window) {
  //   return null
  // }

  const top = Math.max(0, position.top)
  const left = Math.max(0, position.left)

  const controls = useDragControls()
  return (
    <Root
      ref={ref}
      drag
      dragElastic={0}
      dragMomentum={false}
      dragListener={false}
      dragControls={controls}
      dragConstraints={isDragging && rootRef}
      state={'visible'}
      whileDrag={{
        translateY: -1,
        boxShadow: '0px 12px 20px rgba(0,0,0,0.3)',
      }}
      className={cx(
        css({
          layerStyle: 'likec4.floatingWindow',
        }),
        isDragging && 'noselect',
      )}
      initial={{
        top,
        left,
        opacity: 0,
        scale: 0.9,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        scale: 0.9,
      }}
      onDragStart={() => {
        setIsDragging(true)
      }}
      // dragConstraints={rootRef}
      onDragEnd={(_, info) => {
        setIsDragging(false)
        onPositionChange({
          left: roundDpr(left + info.offset.x),
          top: roundDpr(top + info.offset.y),
        })
      }}
      style={{
        width,
        height,
      }}
      // style={{
      //   top,
      //   left,
      // }}
    >
      <Header
        onPointerDown={e => {
          controls.start(e)
        }}>
        {header}
        <HStack flex={'none'}>
          {/* {onMinimize && <button onClick={onMinimize}>Minimize</button>} */}
          {onClose && (
            <CloseButton
              size={'sm'}
              onClick={onClose}
            />
          )}
        </HStack>
      </Header>
      <Content overflowX={'hidden'} overflowY={'scroll'}>
        {/* <ScrollAreaAutosize scrollbars="y" type="scroll" offsetScrollbars> */}
        {children}
        {/* </ScrollAreaAutosize> */}
      </Content>
      <ResizeHandler
        data-position="bottom-right"
        drag
        layout
        dragElastic={0}
        dragMomentum={false}
        onDragStart={() => {
          const rect = ref.current?.getBoundingClientRect()
          if (rect) {
            varWidth.set(rect.width)
            varHeight.set(rect.height)
          }
        }}
        onDrag={(_, info) => {
          varWidth.set(clamp(varWidth.get() + info.delta.x, {
            min: 430,
            max: 700,
          }))
          varHeight.set(clamp(varHeight.get() + info.delta.y, {
            min: 300,
            // max: Infinity,
          }))
        }}
        onDragEnd={() => {
          onResize?.(varWidth.get(), varHeight.get())
        }}
        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </Root>
  )
}
