import { useMantineStyleNonce } from '@mantine/core'
import { domMax, LayoutGroup, LazyMotion, MotionConfig } from 'framer-motion'
import { type PropsWithChildren, useId } from 'react'

export const FramerMotionConfig = ({ children }: PropsWithChildren) => {
  const layoutId = useId()
  const nonce = useMantineStyleNonce()?.()
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" {...nonce && { nonce }}>
        <LayoutGroup id={layoutId}>
          {children}
        </LayoutGroup>
      </MotionConfig>
    </LazyMotion>
  )
}
