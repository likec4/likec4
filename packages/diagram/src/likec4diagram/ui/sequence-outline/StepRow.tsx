import { RichText } from '@likec4/core'
import { css } from '@likec4/styles/css'
import { HStack, styled } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import { IconArrowRight } from '@tabler/icons-react'
import { m } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Markdown } from '../../../base-primitives/Markdown'
import { useDiagram } from '../../../hooks/safeContext'
import { recessed } from './depth-of-field'
import { SEQ_CARD_LAYOUT_ID, SEQ_TRANSITION } from './motion'
import { NotesDot, StepBadge } from './StepBadge'
import type { OutlineTreeNodeStep } from './types'

/** A step the walkthrough is not on: one line, clickable, recessed with its level. */
export function StepRow({ node, recession, active }: {
  active: boolean
  node: OutlineTreeNodeStep
  recession: number
}) {
  const diagram = useDiagram()

  if (active) {
    return <ActiveStepCard node={node} />
  }

  const { stepnum, source, target, label, notes } = node.nodeProps
  return (
    <m.div
      layout
      className={hstack(
        css.raw(recessed, {
          alignItems: 'baseline',
          gap: '2',
          width: '100%',
          paddingInline: '1.5',
          paddingBlock: '1.5',
          rounded: 'sm',
          cursor: 'pointer',
          color: 'text',
          userSelect: 'none',
          _hover: {
            background: '[var(--colors-color-palette-hovered, {colors.surface.sunken})]',
          },
        }),
      )}
      style={{ ['--seq-r' as string]: recession }}
      onClick={() => diagram.walkthroughStep({ step: node.value })}
    >
      <StepBadge>{stepnum}</StepBadge>
      <styled.span
        css={{
          flex: '1',
          minWidth: '0',
          fontSize: 'xs',
          lineHeight: '[18px]',
          whiteSpace: 'pre-line',
          overflowWrap: 'anywhere',
        }}>
        {label ?? `${source} → ${target}`}
      </styled.span>
      {notes && <NotesDot />}
    </m.div>
  )
}

/** The step you are on: lifted onto its own surface, with room for its notes. */
const ActiveStepCard = ({ node }: { node: OutlineTreeNodeStep }) => {
  const ref = useRef<HTMLDivElement>(null)
  const { stepnum, source, target, label, notes } = node.nodeProps

  return (
    <m.div
      ref={ref}
      layoutId={SEQ_CARD_LAYOUT_ID}
      // Position only: the card's height changes with its notes, and animating that would
      // stretch the text inside it.
      layout="position"
      layoutAnchor={false}
      layoutCrossfade={false}
      transition={{
        ...SEQ_TRANSITION,
        when: 'beforeChildren',
      }}
      onLayoutAnimationComplete={() => {
        ref.current?.scrollIntoView({
          block: 'nearest',
        })
      }}
      className={css({
        marginBlock: '2',
        paddingInline: '3',
        paddingBlock: '2.5',
        rounded: 'md',
        background: '[var(--colors-color-palette-label, {colors.surface.sunken})]',
        boxShadow: 'md',
        cursor: 'default',
        scrollMarginTop: '10',
        scrollMarginBottom: '16',
      })}
    >
      <m.div layout="position" className={hstack({ alignItems: 'baseline', gap: '2', width: '100%' })}>
        <StepBadge active>{stepnum}</StepBadge>
        <styled.span
          as={m.div}
          css={{
            flex: '1',
            minWidth: '0',
            fontSize: 'md',
            fontWeight: 'medium',
            lineHeight: '[20px]',
            color: 'text',
            whiteSpace: 'pre-line',
            overflowWrap: 'anywhere',
            textWrap: 'balance',
          }}>
          {label ?? `${source} → ${target}`}
        </styled.span>
      </m.div>
      {label && (
        <m.div
          key="label"
          layout="y"
          initial={{ visibility: 'hidden', overflow: 'hidden', height: 0 }}
          animate={{ visibility: 'visible', overflow: 'visible', height: 'auto' }}
          exit={{ visibility: 'hidden', overflow: 'hidden', height: 0 }}
          transition={SEQ_TRANSITION}
          className={css({
            marginTop: '1',
            marginLeft: '[30px]',
            textStyle: 'dimmed.xxs',
            fontSize: '[8px]',
            color: '[color-mix(in srgb, {colors.text}, transparent 20%)]',
            fontWeight: 'medium',
            letterSpacing: 'caps.sm',
            textTransform: 'uppercase',
            userSelect: 'none',
          })}>
          {source}
          <IconArrowRight
            size={10}
            className={css({
              display: 'inline',
              verticalAlign: '[-0.15em]',
              marginInline: '1',
            })} />
          {target}
        </m.div>
      )}
      {notes && (
        <m.div
          key="Markdown"
          layout
          initial={{ visibility: 'hidden', overflow: 'hidden', height: 10 }}
          animate={{ visibility: 'visible', overflow: 'visible', height: 'auto' }}
          exit={{ visibility: 'hidden', overflow: 'hidden', height: 10 }}
          transition={SEQ_TRANSITION}>
          <Markdown
            value={RichText.from(notes)}
            fontSize={'md'}
            textScale={0.95}
            className={css({
              marginTop: '2.5',
              paddingTop: '2.5',
              paddingBottom: '2',
              borderTop: 'subtle',
              color: 'text',
            })}
            style={{
              borderTopColor: 'oklch(from var(--_border-color) l c h / 25%)',
              ['--_border-color' as string]: 'var(--colors-color-palette-border, var(--colors-border-subtle))',
            }}
          />
        </m.div>
      )}
    </m.div>
  )
}
