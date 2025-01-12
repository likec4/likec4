import { useMantineStyleNonce } from '@mantine/core'
import { domMax, LazyMotion, MotionConfig } from 'framer-motion'
import { type PropsWithChildren } from 'react'

export const FramerMotionConfig = ({ children }: PropsWithChildren) => {
  const nonce = useMantineStyleNonce()?.()
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" {...nonce && { nonce }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
