import { Box } from '@mantine/core'
import { useId } from '@mantine/hooks'
import clsx from 'clsx'
import { type Variants } from 'framer-motion'
import type { PropsWithChildren } from 'react'
import * as css from './ActionButtonBar.css'
import { ActionButtonBarContext } from './useActionButtonBarCtx'

const TRANSLATE_DIFF = 5

type ShiftX = 'left' | 'spread' | 'right'
type ShiftY = 'top' | 'spread' | 'bottom'
type ShiftMode = number | 'spread'

type ActionButtonBarProps = PropsWithChildren<{
  shiftX?: ShiftX
  shiftY?: ShiftY
}>

const elementVariants = (prefix: string, index: number, count: number, shiftX: ShiftMode, shiftY: ShiftMode) => {
  const name = `${prefix}${index + 1}`
  const translation = count > 1
    ? {
      x: shiftX === 'spread' ? 1 - count + index * 2 : shiftX,
      y: shiftY === 'spread' ? 1 - count + index * 2 : shiftY,
    }
    : {
      x: 0,
      y: 1,
    }

  const variants = {
    idle: {
      '--icon-scale': 'scale(1)',
      '--ai-bg': 'var(--ai-bg-idle)',
      scale: 1,
      opacity: 0.8,
      translateX: 0,
      translateY: 0,
      originX: 0.5,
      originY: 0.5,
      // translateY: 0,
      // ...align === 'left' && {
      //   originX: 0.75,
      //   translateX: -1
      // },
      // ...align === 'right' && {
      //   originX: 0.25,
      //   translateX: 1
      // }
    },
    hovered: {
      '--ai-bg': 'var(--ai-bg-hover)',
      '--icon-scale': 'scale(1)',
      // translateY: 3,
      scale: 1.28,
      opacity: 1,
      translateX: translation.x * TRANSLATE_DIFF,
      translateY: translation.y * TRANSLATE_DIFF,
      // ...align === 'left' && {
      //   translateX: -4
      // },
      // ...align === 'right' && {
      //   translateX: 4
      // }
    },
    [`hovered:${name}`]: {
      '--ai-bg': 'var(--ai-hover)',
      '--icon-scale': 'scale(1.08)',
      scale: 1.45,
    },
    [`tap:${name}`]: {
      '--icon-scale': 'scale(1)',
      scale: 1.15,
    },
    selected: {},
  } satisfies Variants
  variants['selected'] = variants['hovered']
  variants['hovered:details'] = variants['idle']
  return {
    variants,
    ['data-animate-target']: name,
  }
}

export const ActionButtonBar = ({
  shiftX = 'spread',
  shiftY = 'spread',
  children,
}: ActionButtonBarProps) => {
  const id = useId()
  const childrenArray = Array.isArray(children) ? children : [children]

  // determine offsets for shifting
  let shiftDiffX: ShiftMode = 'spread'
  if (shiftX == 'left') {
    shiftDiffX = -1
  }
  else if (shiftX == 'right') {
    shiftDiffX = 1
  }

  let shiftDiffY: ShiftMode = 'spread'
  if (shiftY == 'top') {
    shiftDiffY = -1
  }
  else if (shiftY == 'bottom') {
    shiftDiffY = 1
  }

  return (
    <Box className={clsx(css.container)}>
      {childrenArray.map((child, i, all) => (
        <ActionButtonBarContext.Provider
          key={i}
          value={elementVariants(id, i, all.length, shiftDiffX, shiftDiffY)}>
          {child}
        </ActionButtonBarContext.Provider>
        // <>{cloneElement(child, {
        //   key: i,
        //   variants: elementVariants(i, all.length, shiftDiffX, shiftDiffY),
        //   ['data-animate-target']: `i${i + 1}`,
        //   ...props
        // })}</>
      ))}
      {
        /* {childrenArray.filter(child => !!child).map((child, i) => (
        <m.div
          key={i}
          variants={elementVariants(i, childrenArray.length, shiftDiffX, shiftDiffY)}
          {...props}
          >
          {child}
        </m.div>
      ))} */
      }
    </Box>
  )
}
