import { type StepPath, flowAncestors } from '@likec4/core'
import { css } from '@likec4/styles/css'
import { HStack, styled } from '@likec4/styles/jsx'
import { Button, ScrollArea } from '@mantine/core'
import { IconPlayerSkipBackFilled, IconPlayerSkipForwardFilled } from '@tabler/icons-react'
import { LayoutGroup } from 'motion/react'
import { pick } from 'remeda'
import { useDiagram } from '../../../hooks/safeContext'
import { ActiveTrail } from './ActiveTrail'
import { recessionOf, shadedPanelBg } from './depth-of-field'
import { OutlineNodes } from './OutlineNodes'
import { useSelectContext } from './StoreProvider'
import type { CollapsedFlows, OutlineTreeNodes } from './types'

/** Prev/next controls, the "you are here" trail, and the scrollable outline itself. */
export const OutlineBody = () => {
  const { activeStep, next, prev, tree, ancestors } = useSelectContext(s => ({
    activeStep: s.activeStep,
    prev: s.prev,
    next: s.next,
    tree: s.outlineTree,
    ancestors: s.ancestors,
  }))
  const diagram = useDiagram()
  const activeDepth = ancestors.length

  return (
    <>
      <HStack
        css={{
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          paddingInline: '2.5',
          paddingTop: '2',
          paddingBottom: '1',
        }}
      >
        <styled.div
          css={{
            flex: '1',
            textStyle: 'dimmed.xs',
            fontWeight: 'semibold',
            letterSpacing: 'caps.sm',
            textTransform: 'uppercase',
            userSelect: 'none',
          }}>
          Outline
        </styled.div>
        <Button
          tabIndex={-1}
          size="compact-xs"
          variant="light"
          className={css({ fontSize: 'xxs' })}
          leftSection={<IconPlayerSkipBackFilled size={10} />}
          onClick={() => prev && diagram.walkthroughStep({ step: prev })}
          disabled={!prev}>
          Back
        </Button>
        <Button
          tabIndex={-1}
          size="compact-xs"
          variant="light"
          className={css({ fontSize: 'xxs' })}
          rightSection={<IconPlayerSkipForwardFilled size={10} />}
          onClick={() => next && diagram.walkthroughStep({ step: next })}
          disabled={!next}
        >
          Next
        </Button>
      </HStack>
      <ActiveTrail ancestors={ancestors} tree={tree} />
      <ScrollArea
        type="auto"
        overscrollBehavior="contain"
        scrollbars="y"
        offsetScrollbars={'present'}
        className={css({ flex: '1', width: '100%', minHeight: '0' })}
        classNames={{
          viewport: css(shadedPanelBg, {
            paddingInline: '2',
            paddingBottom: '4',
            transitionProperty: 'background',
            transition: 'slow',
          }),
        }}
        style={{
          ['--seq-r' as string]: recessionOf(0, activeDepth),
          ['--seq-badge-bg' as string]: 'var(--colors-primary-body)',
          ['--seq-badge-fg' as string]: 'var(--colors-primary-text)',
        }}
      >
        <OutlineNodes
          nodes={tree}
          depth={0}
          activeStep={activeStep}
          activeDepth={activeDepth}
        />
      </ScrollArea>
    </>
  )
}
