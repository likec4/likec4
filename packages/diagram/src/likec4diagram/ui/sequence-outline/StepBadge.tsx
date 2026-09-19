import { css } from '@likec4/styles/css'
import { Box } from '@likec4/styles/jsx'
import { m } from 'motion/react'
import type { ReactNode } from 'react'
import { SEQ_BADGE_LAYOUT_ID, SEQ_TRANSITION } from './motion'

const stepBadgeBase = css.raw({
  flex: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '[20px]',
  height: '[18px]',
  paddingInline: '1',
  rounded: 'sm',
  bg: 'surface.sunken',
  color: 'text.dimmed',
  fontSize: '[10px]',
  fontWeight: 'bold',
  fontVariantNumeric: 'tabular-nums',
  userSelect: 'none',
})

const stepBadgeActive = css.raw(stepBadgeBase, {
  minWidth: '[22px]',
  height: '[20px]',
  // Composited over the panel rather than the tinted card, so the alpha lands predictably.
  background: '[linear-gradient(var(--seq-badge-bg), var(--seq-badge-bg)), {colors.likec4.panel.bg}]',
  color: '[var(--seq-badge-fg)]',
  fontSize: '[11px]',
})

/** The step number pill. The active one carries the shared `layoutId`, so it travels between steps. */
export const StepBadge = ({ children, active }: { children: ReactNode; active?: boolean }) =>
  active
    ? (
      <m.div
        layoutId={SEQ_BADGE_LAYOUT_ID}
        layout="position"
        transition={SEQ_TRANSITION}
        className={css(stepBadgeActive)}>
        {children}
      </m.div>
    )
    : <div className={css(stepBadgeBase)}>{children}</div>

/** Marks a step that carries notes, without letting the note reflow the list. */
export const NotesDot = () => (
  <Box
    css={{
      flex: 'none',
      alignSelf: 'flex-start',
      boxSize: '[5px]',
      marginTop: '[7px]',
      rounded: 'pill',
      bg: 'text.dimmed',
    }}
  />
)
