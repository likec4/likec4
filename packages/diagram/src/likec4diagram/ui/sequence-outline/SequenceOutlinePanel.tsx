import {
  type DynamicViewFlow,
  type StepPath,
  dynamicViewFlow,
  flowAncestors,
  hasProp,
  isDynamicView,
} from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { Box, HStack, styled, VStack } from '@likec4/styles/jsx'
import { vstack } from '@likec4/styles/patterns'
import {
  type RenderTreeNodePayload,
  ActionIcon,
  Button,
  CloseButton,
  CloseIcon,
  FocusTrap,
  ScrollArea,
  Tooltip,
  Tree,
  useTree,
} from '@mantine/core'
import {
  IconAlertTriangle,
  IconArrowFork,
  IconArrowGuide,
  IconArrowRight,
  IconChevronRight,
  IconCornerDownRight,
  IconListTree,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconPlayerStop,
  IconRepeat,
} from '@tabler/icons-react'
import { AnimatePresence, m } from 'motion/react'
import { type ReactNode, memo, useMemo } from 'react'
import { mapToObj, only } from 'remeda'
import { PortalToContainer } from '../../../custom'
import { selectDiagramContext, useDiagram, useDiagramSelector } from '../../../hooks/safeContext'
import { useOnDiagramEvent } from '../../../hooks/useDiagram'
import { type OutlineTreeNodeData, countSteps, useTreeData } from './state'

// -----------------------------------------------------------------------------
// Flow-type presentation
// -----------------------------------------------------------------------------

type FlowType = DynamicViewFlow.SubFlowType

/**
 * PandaCSS `colorPalette` classes for each sub-flow palette.
 * Declared as literals so the static analyzer can extract them.
 */
const palette = {
  loop: css({ colorPalette: 'subflow.loop' }),
  opt: css({ colorPalette: 'subflow.opt' }),
  par: css({ colorPalette: 'subflow.par' }),
  break: css({ colorPalette: 'subflow.break' }),
  alt: css({ colorPalette: 'subflow.alt' }),
  try: css({ colorPalette: 'subflow.try' }),
} as const

type FlowPresentation = {
  readonly paletteClass: string
  readonly tag: string
  readonly Icon: typeof IconRepeat
}

const flowPresentation: Record<FlowType, FlowPresentation> = {
  loop: { paletteClass: palette.loop, tag: 'loop', Icon: IconRepeat },
  opt: { paletteClass: palette.opt, tag: 'opt', Icon: IconArrowGuide },
  par: { paletteClass: palette.par, tag: 'par', Icon: IconArrowFork },
  break: { paletteClass: palette.break, tag: 'break', Icon: IconPlayerStop },
  alt: { paletteClass: palette.alt, tag: 'alt', Icon: IconArrowFork },
  'alt-when': { paletteClass: palette.alt, tag: 'when', Icon: IconCornerDownRight },
  'alt-else': { paletteClass: palette.alt, tag: 'else', Icon: IconCornerDownRight },
  'alt-if': { paletteClass: palette.alt, tag: 'if', Icon: IconCornerDownRight },
  try: { paletteClass: palette.try, tag: 'try', Icon: IconAlertTriangle },
  'try-block': { paletteClass: palette.try, tag: 'block', Icon: IconCornerDownRight },
  'try-catch': { paletteClass: palette.break, tag: 'catch', Icon: IconCornerDownRight },
  'try-finally': { paletteClass: palette.break, tag: 'finally', Icon: IconCornerDownRight },
}

// -----------------------------------------------------------------------------
// Styled primitives
// -----------------------------------------------------------------------------

const SectionLabel = styled('div', {
  base: {
    textStyle: 'dimmed.xs',
    fontWeight: 'semibold',
    letterSpacing: 'wider',
    textTransform: 'uppercase',
    userSelect: 'none',
  },
})

/** Numeric step badge (e.g. `12`). */
const StepNum = styled('div', {
  base: {
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '22px',
    height: '18px',
    paddingInline: '1',
    rounded: 'sm',
    bg: 'surface.sunken',
    color: 'text.dimmed',
    fontSize: '[10px]',
    fontWeight: 'bold',
    fontVariantNumeric: 'tabular-nums',
    userSelect: 'none',
  },
})

/** Small pill tag for the sub-flow operator (`loop`, `par`, `try`, …). */
const FlowTag = styled('div', {
  base: {
    flex: 'none',
    paddingInline: '1.5',
    paddingBlock: '0.5',
    rounded: 'sm',
    bg: 'colorPalette.label',
    color: 'colorPalette.text',
    fontSize: '[9px]',
    fontWeight: 'bold',
    lineHeight: 'xs',
    letterSpacing: 'tight',
    textTransform: 'uppercase',
    userSelect: 'none',
  },
})

const rowBase = css.raw({
  display: 'flex',
  alignItems: 'center',
  gap: '2',
  width: '100%',
  paddingInline: '1.5',
  paddingBlock: '1',
  rounded: 'md',
  cursor: 'pointer',
  color: 'text',
  userSelect: 'none',
  transition: 'background-color 120ms ease',
  _hover: {
    bg: 'surface.sunken/60',
  },
  '&[data-selected="true"]': {
    bg: 'mantine.primary.light',
    color: 'mantine.primary.lightColor',
  },
})

const labelText = css.raw({
  flex: '1',
  minWidth: '0',
  fontSize: 'xs',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

// -----------------------------------------------------------------------------
// Panel
// -----------------------------------------------------------------------------

const selectFlow = selectDiagramContext((s) => {
  const activeStep = s.activeWalkthrough?.stepId ?? null
  if (activeStep) {
    return {
      flow: isDynamicView(s.view) && hasProp(s.view, 'flow') ? dynamicViewFlow(s.view) : null,
      activeStep,
      title: s.view.title,
      outlinePanelWidth: s.activeWalkthrough?.outlinePanelWidth,
    }
  }
  return {
    flow: null,
    activeStep: null,
    title: s.view.title,
  }
})

export const SequenceOutlinePanel = memo(() => {
  const { activeStep, flow, title, outlinePanelWidth } = useDiagramSelector(selectFlow)

  return (
    <PortalToContainer>
      <AnimatePresence propagate>
        {activeStep && flow && outlinePanelWidth && (
          <m.div
            layout="position"
            className={vstack({
              position: 'absolute',
              top: '0',
              left: '0',
              layerStyle: 'likec4.panel',
              rounded: '0',
              gap: '0',
              padding: '0',
              pointerEvents: 'all',
              maxWidth: '85cqw',
              height: '100cqh',
              maxHeight: '100cqh',
              cursor: 'default',
              overflow: 'hidden',
            })}
            style={{
              width: outlinePanelWidth,
            }}
            initial={{ opacity: 0.5, translateX: -40 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -outlinePanelWidth }}
          >
            <OutlineHeader title={title} flow={flow} />
            <OutlineBody activeStep={activeStep} flow={flow} />
          </m.div>
        )}
      </AnimatePresence>
    </PortalToContainer>
  )
})
SequenceOutlinePanel.displayName = 'SequenceOutlinePanel'

const OutlineHeader = ({ title, flow }: { title: string | null; flow: DynamicViewFlow }) => {
  const diagram = useDiagram()
  const stepCount = flow.stepsCount
  return (
    <HStack
      css={{
        gap: '2.5',
        alignItems: 'center',
        width: '100%',
        paddingInline: '2.5',
        paddingBlock: '2',
        borderBottom: '1px solid {colors.likec4.panel.border}',
      }}
    >
      <Box
        css={{
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSize: '28px',
          rounded: 'md',
          colorPalette: 'subflow.loop',
          bg: 'colorPalette.label',
          color: 'colorPalette.text',
        }}
      >
        <IconListTree size={16} />
      </Box>
      <VStack css={{ gap: '0', alignItems: 'stretch', flex: '1', minWidth: '0' }}>
        <styled.div
          css={{
            fontSize: 'sm',
            fontWeight: 'semibold',
            color: 'text',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {title ?? 'Sequence'}
        </styled.div>
        <styled.div css={{ textStyle: 'dimmed.xs' }}>
          {stepCount} {stepCount === 1 ? 'step' : 'steps'}
        </styled.div>
      </VStack>
      <Box
        css={{
          flex: 'none',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CloseButton size="sm" onClick={() => diagram.stopWalkthrough()} />
      </Box>
    </HStack>
  )
}

const OutlineBody = ({ activeStep, flow }: { activeStep: StepPath; flow: DynamicViewFlow }) => {
  const diagram = useDiagram()
  const treeData = useTreeData(flow)
  const initialExpandedState = useMemo(() => mapToObj(flowAncestors(activeStep), id => [id, true]), [])

  const tree = useTree({
    initialSelectedState: [activeStep],
    initialExpandedState,
    multiple: false,
    onSelectedStateChange(selected) {
      const step = only(selected as StepPath[])
      if (step && flow.isStep(step)) {
        diagram.walkthroughStep({ step })
      }
    },
  })

  useOnDiagramEvent('walkthroughStep', ({ stepId }) => {
    if (!tree.selectedState.includes(stepId)) {
      const ancestors = flowAncestors(stepId)
      if (ancestors.length > 0) {
        const expanded = { ...tree.expandedState }
        for (const parent of ancestors) {
          expanded[parent] = true
        }
        tree.setExpandedState(expanded)
      }
      tree.setSelectedState([stepId])
    }
  })

  const allCollapsed = useMemo(
    () => Object.values(tree.expandedState).every(v => !v),
    [tree.expandedState],
  )

  const { prev, next } = flow.prevAndNext(activeStep)

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
        <SectionLabel flex={'1'}>Outline</SectionLabel>
        <Tooltip
          label={allCollapsed ? 'Expand all' : 'Collapse all'}
          fz="xs"
          openDelay={500}
          withinPortal={false}
        >
          <ActionIcon
            tabIndex={-1}
            variant="subtle"
            size="sm"
            onClick={() => (allCollapsed ? tree.expandAllNodes() : tree.collapseAllNodes())}
          >
            <IconListTree size={14} />
          </ActionIcon>
        </Tooltip>
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
      <ScrollArea
        type="scroll"
        overscrollBehavior="contain"
        className={css({ flex: '1', width: '100%', minHeight: '0' })}
      >
        <Tree
          levelOffset={0}
          data={treeData}
          tree={tree}
          selectOnClick
          classNames={{
            root: css({ paddingInline: '2', paddingBottom: '3' }),
            // Draw a connecting rail down each nested sub-flow.
            subtree: css({
              marginInlineStart: '3',
              paddingInlineStart: '2.5',
              borderLeft: '1px solid {colors.mantine.colors.defaultBorder}',
            }),
          }}
          renderNode={renderTreeNode}
        />
      </ScrollArea>
    </>
  )
}

// -----------------------------------------------------------------------------
// Node renderers
// -----------------------------------------------------------------------------

type OutlineTreeNodeProps = Omit<RenderTreeNodePayload, 'node'> & { node: OutlineTreeNodeData }

const renderTreeNode = ((payload: OutlineTreeNodeProps) => {
  return payload.node.nodeProps.type === 'step'
    ? <StepRow {...(payload as StepRowProps)} />
    : <FlowRow {...(payload as FlowRowProps)} />
}) as (payload: RenderTreeNodePayload) => ReactNode

type StepRowProps = OutlineTreeNodeProps & { node: Extract<OutlineTreeNodeData, { nodeProps: { type: 'step' } }> }

const StepRow = ({ node, elementProps }: StepRowProps) => {
  const { stepnum, source, target, label } = node.nodeProps
  return (
    <Box {...elementProps} className={cx(elementProps.className, css(rowBase))}>
      <StepNum>{stepnum}</StepNum>
      <IconArrowRight
        size={13}
        className={css({ flex: 'none', color: 'text.dimmed' })}
      />
      {label
        ? <span className={css(labelText)}>{label}</span>
        : (
          <HStack css={{ gap: '1', minWidth: '0', flex: '1' }}>
            <styled.span css={{ ...labelText, flex: 'none', color: 'text.dimmed' }}>{source}</styled.span>
            <IconArrowRight size={11} className={css({ flex: 'none', color: 'text.dimmed' })} />
            <span className={css(labelText)}>{target}</span>
          </HStack>
        )}
    </Box>
  )
}

type FlowRowProps = OutlineTreeNodeProps & { node: Extract<OutlineTreeNodeData, { nodeProps: { type: FlowType } }> }

const FlowRow = ({ node, expanded, elementProps }: FlowRowProps) => {
  const { type, title, stepCount } = node.nodeProps
  const { paletteClass, tag, Icon } = flowPresentation[type]
  return (
    <Box
      {...elementProps}
      className={cx(elementProps.className, paletteClass, css(rowBase))}
    >
      <IconChevronRight
        size={14}
        className={css({
          flex: 'none',
          color: 'text.dimmed',
          transition: 'transform 150ms ease',
          '&[data-expanded="true"]': { transform: 'rotate(90deg)' },
        })}
        data-expanded={expanded}
      />
      <Icon size={14} className={css({ flex: 'none', color: 'colorPalette.text' })} />
      <styled.span css={{ ...labelText, fontWeight: 'medium' }}>
        {title ?? tag}
      </styled.span>
      <FlowTag>{tag}</FlowTag>
      <styled.span
        css={{
          flex: 'none',
          textStyle: 'dimmed.xs',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {stepCount}
      </styled.span>
    </Box>
  )
}
