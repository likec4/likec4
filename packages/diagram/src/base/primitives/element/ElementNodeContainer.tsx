import type { DiagramNode } from '@likec4/core'
import { ActionIcon, Box } from '@mantine/core'
import { IconZoomScan } from '@tabler/icons-react'
import clsx from 'clsx'
import { m } from 'framer-motion'
import { type PropsWithChildren } from 'react'
import { stopPropagation } from '../../../xyflow/utils'
import type { NodeProps } from '../../types'
import * as css from './element.css'

type Data = Pick<
  DiagramNode,
  | 'color'
  | 'shape'
>

type ElementNodeContainerProps = PropsWithChildren<NodeProps<Data>>

export function ElementNodeContainer({
  dragging = false,
  data,
  children,
}: ElementNodeContainerProps) {
  // const [animateVariants, animateHandlers] = useFramerAnimateVariants()
  // if (!dragging && !isInActiveOverlay) {
  //   animateVariant = animateVariants ?? animateVariant
  // }

  // const isHovered = !!animateVariants && animateVariants.includes('hovered')

  // const _isToolbarVisible = (selected && !dragging) || isHovered
  // const [isToolbarVisible] = useDebouncedValue(_isToolbarVisible, _isToolbarVisible ? 500 : 300)

  // const elementIcon = ElementIcon({
  //   element,
  //   viewId,
  //   className: css.elementIcon,
  //   renderIcon,
  // })

  // const [previewColor, setPreviewColor] = useState<ThemeColor | null>(null)
  const isHovered = data.hovered ?? false
  // const [isTapped, toggleTap] = useToggle(false)
  // const [isHovered, toggle] = useToggle(false)

  return (
    <Box
      component={m.div}
      className={clsx([
        css.container,
        'likec4-element-node',
      ])}
      layoutRoot
      animate={!dragging}
      whileHover={{
        scale: 1.05,
        // transition: {
        //   delay: 0.09,
        // },
      }}
      whileTap={{ scale: 0.98 }}
      data-hovered={isHovered}
      data-likec4-color={data.color}
      data-likec4-shape={data.shape}
    >
      {children}
    </Box>
  )
}

// const Acttion = ({ isHovered }: { isHovered: boolean }) => {
//   return (
//     <Box
//       component={m.div}
//       layout
//       initial={false}
//       animate={{
//         opacity: isHovered ? 1 : 0.75,
//         top: isHovered ? 'calc(100% - 26px)' : 'calc(100% - 34px)',
//         // transform: isHovered ? 'translateY(10px) scale(1.07)' : 'translateY(0) scale(1)',
//         // translateY: isHovered ? '-10px' : '-100%',
//         // paddingTop: isHovered ? '10px' : '0px',
//         // bottom: isHovered ? '-3px' : '0px',
//         // originY: 0,
//         // bottom: isHovered ? '-10px' : '0px',
//         // scale: isHovered ? 1.03 : 1,
//         // translateY: isHovered ? 10 : 0,
//         //     gap: 6,
//         // left: 0,
//         // width: '100%',
//         // display: 'flex',
//         // justifyContent: 'center',
//         // alignItems: 'center',
//         gap: isHovered ? '10px' : '1px',
//       }}
//       // transition={{
//       //   delay: isHovered ? 0.1 : 0,
//       //   // gap: {
//       //   //   duration: 0,
//       //   // }
//       // }}
//       className={clsx('nodrag nopan', css.bottomActions)}
//     >
//       <m.div
//         layout
//         whileTap={{ scale: 0.9 }}
//         whileHover={{
//           scale: 1.35,
//         }}
//         animate={{
//           scale: isHovered ? 1.15 : 1,
//         }}
//       >
//         <ActionIcon
//           // layout

//           className={clsx('nodrag nopan', css.bottomButton)}
//           radius="md"
//           onClick={stopPropagation}
//           // onTap={(e) => {
//           //   console.log('ActionIcon onTap', e)
//           //   e.cancelBubble
//           // }}
//           // onTapStart={(e) => {
//           //   console.log('ActionIcon onTapStart', e)
//           // }}
//           // whileHover={{
//           //   scale: 1.1,
//           // }}
//           // whileTap={{ scale: 0.9 }}
//         >
//           <IconZoomScan />
//         </ActionIcon>
//       </m.div>{' '}
//       {
//         /* <m.div
//         layout
//         animate={{
//           width: isHovered ? '8px' : '0px',
//           scale: isHovered ? 1.2 : 1,
//         }}
//       >
//       </m.div> */
//       }
//       <m.div
//         layout
//         // animate={!dragging}
//         // layout
//         whileTap={{ scale: 0.9 }}
//         whileHover={{
//           scale: 1.35,
//         }}
//         animate={{
//           scale: isHovered ? 1.15 : 1,
//         }}
//       >
//         <ActionIcon
//           // layout

//           className={clsx('nodrag nopan', css.bottomButton)}
//           radius="md"
//           onClick={stopPropagation}
//           // onTap={(e) => {
//           //   console.log('ActionIcon onTap', e)
//           //   e.cancelBubble
//           // }}
//           // onTapStart={(e) => {
//           //   console.log('ActionIcon onTapStart', e)
//           // }}
//           // whileHover={{
//           //   scale: 1.1,
//           // }}
//           // whileTap={{ scale: 0.9 }}
//         >
//           <IconZoomScan />
//         </ActionIcon>
//       </m.div>
//       {
//         /* <Box
//         component={m.div}
//         layout
//         whileTap={{ scale: 0.9 }}
//         animate={{
//           // opacity: isHovered ? 1 : 0.75,
//           // bottom: isHovered ? '-10px' : '0px',
//           originX: 0.3,
//           originY: 0.3,
//           scale: isHovered ? 1.25 : 1,
//           // translateY: isHovered ? 10 : 0,
//           //     gap: 6,
//           // left: 0,
//           // width: '100%',
//           // display: 'flex',
//           // justifyContent: 'center',
//           // alignItems: 'center',
//           // gap: isHovered ? '8px' : '0px',
//         }}>
//         <ActionIcon
//           // component={m.div}
//           // layout
//           className={clsx('nodrag nopan', css.bottomButton)}
//           radius="md"
//           onClick={stopPropagation}
//           // variant="default"
//           // onTap={(e) => {
//           //   console.log('ActionIcon onTap', e)
//           //   e.cancelBubble
//           // }}
//           // onTapStart={(e) => {
//           //   console.log('ActionIcon onTapStart', e)
//           // }}
//           // whileHover={{
//           //   scale: 1.1,
//           // }}
//           // whileTap={{ scale: 0.9 }}
//         >
//           <IconZoomScan />
//         </ActionIcon>
//       </Box> */
//       }
//     </Box>
//   )
// }
