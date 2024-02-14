import { ActionIcon } from '@mantine/core'
import clsx from 'clsx'
import { motion, type Variants } from 'framer-motion'
import { ZoomIn } from '../../icons'

export type NavigateToBtnProps = {
  onClick: () => void
  className?: string
}

// // Frame-motion variants
// const variants = {
//   idle: {
//     transformOrigin: '50% 50%',
//     translateX: "-50%",
//     scale: 0.9,
//     backgroundColor: "var(--ai-bg)",
//     opacity: 0.8
//   },
//   hover: {
//     scale: 1.4,
//     translateX: "-50%",
//     opacity: 1,
//     backgroundColor: "var(--ai-bg-hover)",
//     // transition: {
//     //   delay: 0.1
//     // }
//   },
//   dragging: {
//     scale: 1,
//     translateX: "-50%",
//     opacity: 1,
//     backgroundColor: "var(--ai-bg)",
//     transition: {
//       type: 'spring'
//     }
//   }
// } satisfies Variants

export function NavigateToBtn({ onClick, className }: NavigateToBtnProps) {
  // const api = useLikeC4ViewEditor()
  // const navigateToView = api.navigateTo
  // return (
  //   <motion.button
  //     className={clsx(
  //       'mantine-focus-auto mantine-ActionIcon-root  mantine-UnstyledButton-root',
  //       'nodrag',
  //       className
  //     )}
  //     type="button">
  //     <span className="mantine-ActionIcon-icon">
  //       <ZoomIn />
  //     </span>
  //   </motion.button>
  // )
  return (
    <ActionIcon
      className={clsx('nodrag nopan', className)}
      radius="xl"
      autoFocus={false}
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onClick()
      }}
    >
      <ZoomIn />
    </ActionIcon>
  )
}
