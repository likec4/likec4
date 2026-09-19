import { HStack, styled } from '@likec4/styles/jsx'
import { IconChevronRight } from '@tabler/icons-react'
import { Fragment } from 'react'
import { useDiagram } from '../../../hooks/safeContext'
import { flowPresentation } from './presentation'
import { collectTrail, firstStepOf } from './tree'
import type { OutlineTreeNodes } from './types'

/**
 * Sticky "you are here" trail: the fragments the active step is nested inside.
 * Each segment jumps the walkthrough to the first step of that fragment.
 */
export const ActiveTrail = ({ ancestors, tree }: { ancestors: readonly string[]; tree: OutlineTreeNodes }) => {
  const diagram = useDiagram()
  const trail = collectTrail(tree, ancestors)
  // At the root you are not inside anything — the toolbar label already says where you are.
  if (trail.length === 0) return null
  return (
    <HStack
      css={{
        gap: '1',
        flexWrap: 'wrap',
        marginBottom: '1.5',
        paddingInline: '2.5',
        paddingBlock: '1.5',
        bg: 'likec4.panel.bg',
        borderBottom: 'panel',
        textStyle: 'dimmed.xxs',
        fontWeight: 'semibold',
        letterSpacing: 'caps.sm',
        textTransform: 'uppercase',
        userSelect: 'none',
        '& svg': { flex: 'none', opacity: '[0.5]' },
      }}
    >
      {trail.map((node, i) => {
        const { paletteClass, tag } = flowPresentation[node.nodeProps.type]
        const label = node.nodeProps.title ? `${tag} ${node.nodeProps.title}` : tag
        const last = i === trail.length - 1
        const firstStep = firstStepOf(node.children)
        return (
          <Fragment key={node.value}>
            {i > 0 && <IconChevronRight size={10} />}
            <styled.button
              type="button"
              className={last ? paletteClass : undefined}
              title={`Jump to the first step of ${label}`}
              disabled={!firstStep}
              onClick={() => firstStep && diagram.walkthroughStep({ step: firstStep })}
              css={{
                appearance: 'none',
                border: 'none',
                background: 'transparent',
                padding: '0',
                font: 'inherit',
                letterSpacing: '[inherit]',
                textTransform: 'inherit',
                cursor: 'pointer',
                rounded: 'sm',
                transitionProperty: 'colors',
                transition: 'fast',
                maxWidth: '[200px]',
                truncate: true,
                ...last
                  ? { fontWeight: 'extrabold', color: 'colorPalette.text' }
                  : { color: 'inherit', _hover: { color: 'text' } },
                _disabled: { cursor: 'default' },
                _focusVisible: {
                  outline: '[2px solid {colors.primary.border}]',
                  outlineOffset: '[2px]',
                },
              }}>
              {label}
            </styled.button>
          </Fragment>
        )
      })}
    </HStack>
  )
}
