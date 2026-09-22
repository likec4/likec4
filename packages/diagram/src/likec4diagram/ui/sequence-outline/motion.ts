/**
 * Shared-layout transitions. The frame, the card and the badge each carry a `layoutId`, so
 * walking a step moves one element rather than swapping two — the frame travels to the branch
 * you entered and the card slides to the step you landed on. House easing, one exponential
 * ease-out; `MotionConfig` already drops these under reduced motion and reduced graphics.
 */
export const SEQ_TRANSITION = { duration: 0.24, ease: [0.2, 0.8, 0.2, 1] } as const

export const SEQ_FRAME_LAYOUT_ID = 'likec4-seq-active-frame'
export const SEQ_CARD_LAYOUT_ID = 'likec4-seq-active-card'
export const SEQ_BADGE_LAYOUT_ID = 'likec4-seq-active-badge'
