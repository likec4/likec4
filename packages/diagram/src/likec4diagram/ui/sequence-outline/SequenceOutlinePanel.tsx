import {
  type DynamicViewFlow,
  type scalar,
  type StepPath,
  dynamicViewFlow,
  flowAncestors,
  hasProp,
  isDynamicView,
  RichText,
} from '@likec4/core'
import { extractViewTitleFromPath } from '@likec4/core/model'
import { css, cx } from '@likec4/styles/css'
import { Box, HStack, styled, Txt, VStack } from '@likec4/styles/jsx'
import { vstack } from '@likec4/styles/patterns'
import { Button, CloseButton, ScrollArea, Spoiler } from '@mantine/core'
import {
  IconAlertTriangle,
  IconArrowFork,
  IconArrowGuide,
  IconArrowRight,
  IconChevronRight,
  IconCornerDownRight,
  IconDirectionSignFilled,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
  IconPlayerStop,
  IconRepeat,
} from '@tabler/icons-react'
import { AnimatePresence, m } from 'motion/react'
import { type ReactNode, Fragment, memo, useEffect, useRef } from 'react'
import { Markdown, PortalToContainer } from '../../../custom'
import { selectDiagramContext, useDiagram, useDiagramSelector } from '../../../hooks/safeContext'
import type { DiagramContext } from '../../state/types'
import { type OutlineTreeNodeData, isOutlineFlowNode, useTreeData } from './state'

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
// Depth of field
// -----------------------------------------------------------------------------

/**
 * The outline reads as a stack of planes: the nesting level the walkthrough is standing on
 * renders at full strength, and every level *above* it steps back in contrast, saturation
 * and surface tone. `--seq-r` is that distance (0 = you are here, capped at 3).
 *
 * The recession is relative, not absolute — it is recomputed as the walkthrough enters and
 * leaves a fragment, so stepping back out to the root flattens the panel again.
 */
const MAX_RECESSION = 3
const recessionOf = (depth: number, activeDepth: number) => Math.min(MAX_RECESSION, Math.max(0, activeDepth - depth))

/** Per-level falloff, applied once per step of `--seq-r`. */
const OPACITY_STEP = 0.26
const SATURATION_STEP = 0.286
/**
 * Depth is mixed toward black rather than toward the canvas token: in dark mode canvas is
 * darker than the panel, but in light mode the two are both white, so only a neutral shade
 * recedes in both schemes.
 */
const SHADE_STEP = '4.55%'

const recessed = css.raw({
  opacity: `[calc(1 - var(--seq-r, 0) * ${OPACITY_STEP})]`,
  filter: `[saturate(calc(1 - var(--seq-r, 0) * ${SATURATION_STEP}))]`,
  transitionProperty: '[opacity, filter]',
  transition: 'slow',
  // Nothing that has receded should be unreadable when you reach for it.
  _hover: {
    opacity: '[1]',
    filter: '[none]',
  },
})

/** A nesting level, as a full-bleed tonal band. Tone only — no border, no radius, no card. */
const levelBand = css.raw({
  position: 'relative',
  marginInline: '-2',
  paddingInline: '2',
  background: `[color-mix(in srgb, {colors.likec4.panel.bg}, #000 calc(var(--seq-r, 0) * ${SHADE_STEP}))]`,
  transitionProperty: 'background',
  transition: 'slow',
})

/**
 * A fragment nested *below* the level you are standing on: structure, not colour.
 *
 * Fills do not survive nesting — five levels of translucent fragment tint compound into mud,
 * and a fragment you are not inside has no claim on the eye. Depth is carried by an indent and
 * a hairline in the fragment's own colour; the tag pill and icon already say which kind it is.
 */
const nestedBand = css.raw({
  background: 'transparent',
  marginInline: '0',
  marginBlock: '0.5',
  paddingInline: '0',
  paddingLeft: '2',
  borderLeft: '[1px solid {colors.colorPalette.border}]',
  rounded: '0',
})

/** The fragment you are standing inside, framed the way the canvas frames it. */
const activeFrame = css.raw({
  background: '[linear-gradient(var(--seq-frame-bg), var(--seq-frame-bg)), {colors.likec4.panel.bg}]',
  // Clear of the frame line on every side, so the step does not sit on the border.
  paddingInline: '3',
  paddingBlock: '1.5',
  marginBlock: '1',
  _after: {
    content: '""',
    position: 'absolute',
    inset: '[0 6px]',
    border: '[1px solid {colors.colorPalette.border}]',
    rounded: 'md',
    pointerEvents: 'none',
  },
})

// -----------------------------------------------------------------------------
// Panel
// -----------------------------------------------------------------------------

const selectFlow = selectDiagramContext((s) => {
  const title = extractViewTitleFromPath(s.view.title ?? 'Untitled')
  const description = s.view.description
  const activeStep = s.activeWalkthrough?.stepId ?? null
  if (activeStep) {
    return {
      flow: isDynamicView(s.view) && hasProp(s.view, 'flow') ? dynamicViewFlow(s.view) : null,
      activeStep,
      title,
      description,
      outlinePanelWidth: s.activeWalkthrough?.outlinePanelWidth ?? 0,
      collapsed: s.collapsedSequenceFlows,
    }
  }
  return {
    flow: null,
    activeStep: null,
    title,
    description,
  }
})

export const SequenceOutlinePanel = memo(() => {
  const props = useDiagramSelector(selectFlow)

  return (
    <PortalToContainer>
      <AnimatePresence propagate>
        {props.activeStep && props.flow && (
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
              maxWidth: '[85cqw]',
              height: '100cqh',
              maxHeight: '100cqh',
              cursor: 'default',
              overflow: 'hidden',
            })}
            style={{
              width: props.outlinePanelWidth,
            }}
            initial={{ opacity: 0.5, translateX: -40 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -props.outlinePanelWidth }}
          >
            <SequenceOutlinePanelBody
              title={props.title}
              description={props.description}
              activeStep={props.activeStep}
              flow={props.flow}
              collapsed={props.collapsed}
            />
          </m.div>
        )}
      </AnimatePresence>
    </PortalToContainer>
  )
})
SequenceOutlinePanel.displayName = 'SequenceOutlinePanel'

type SequenceOutlinePanelBodyProps = {
  title: string | null
  description: scalar.MarkdownOrString | null
  activeStep: StepPath
  flow: DynamicViewFlow
  collapsed: DiagramContext['collapsedSequenceFlows']
}
function SequenceOutlinePanelBody(props: SequenceOutlinePanelBodyProps) {
  const tree = useTreeData(props.flow, props.collapsed)
  const stepnum = findStepNumber(tree, props.activeStep) ?? 1

  return (
    <>
      <OutlineHeader
        title={props.title}
        flow={props.flow}
        description={props.description}
        stepnum={stepnum}
      />
      <OutlineBody
        activeStep={props.activeStep}
        flow={props.flow}
        tree={tree}
        collapsed={props.collapsed} />
    </>
  )
}

function findStepNumber(nodes: OutlineTreeNodeData[], step: StepPath): number | null {
  for (const node of nodes) {
    if (isOutlineFlowNode(node)) {
      const found = findStepNumber(node.children, step)
      if (found !== null) return found
    } else if (node.value === step) {
      return node.nodeProps.stepnum
    }
  }
  return null
}

const OutlineHeader = ({
  title,
  flow,
  description,
  stepnum,
}: Pick<SequenceOutlinePanelBodyProps, 'title' | 'flow' | 'description'> & { stepnum: number }) => {
  const diagram = useDiagram()
  const stepCount = flow.stepsCount
  const pad = String(stepCount).length
  return (
    <VStack
      css={{
        gap: '2.5',
        width: '100%',
        paddingInline: '2.5',
        paddingBlock: '2',
        borderBottom: 'panel',
      }}>
      <HStack
        css={{
          gap: '2.5',
          alignItems: 'flex-start',
          width: '100%',
          padding: '0',
        }}
      >
        <Box
          css={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSize: '[20px]',
            rounded: 'sm',
            colorPalette: 'subflow.loop',
            bg: 'colorPalette.label',
            color: 'colorPalette.text',
          }}
        >
          <IconDirectionSignFilled size={14} />
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
          <styled.div
            css={{
              marginTop: '0.5',
              textStyle: 'dimmed.xxs',
              fontWeight: 'medium',
              letterSpacing: 'caps.sm',
              textTransform: 'uppercase',
              fontVariantNumeric: 'tabular-nums',
              userSelect: 'none',
            }}
          >
            Step {String(stepnum).padStart(pad, '0')} / {stepCount}
          </styled.div>
          <Box
            css={{
              height: '[2px]',
              marginTop: '1.5',
              rounded: 'xs',
              bg: 'border.subtle',
              overflow: 'hidden',
            }}
          >
            <styled.div
              css={{
                height: '100%',
                rounded: 'xs',
                bg: 'primary.body',
                transitionProperty: '[width]',
                transition: 'slow',
              }}
              style={{ width: `${stepnum / stepCount * 100}%` }}
            />
          </Box>
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
      {description && (
        <Spoiler
          showLabel={<Txt size="xxs">show description</Txt>}
          hideLabel={<Txt size="xxs">hide</Txt>}
          maxHeight={16}
        >
          <Markdown
            value={RichText.from(description)}
            className={css({
              color: 'text.dimmed',
            })}
            fontSize={'xxs'}
          />
        </Spoiler>
      )}
    </VStack>
  )
}

const OutlineBody = (
  { activeStep, flow, tree }: Pick<SequenceOutlinePanelBodyProps, 'activeStep' | 'flow' | 'collapsed'> & {
    tree: OutlineTreeNodeData[]
  },
) => {
  const diagram = useDiagram()
  const ancestors = flowAncestors(activeStep)
  const activeDepth = ancestors.length
  const { prev, next } = flow.prevAndNext(activeStep, () => false)

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
      <ScrollArea
        type="auto"
        overscrollBehavior="contain"
        className={css({ flex: '1', width: '100%', minHeight: '0' })}
        classNames={{
          viewport: css({
            paddingInline: '2',
            paddingBottom: '4',
            background: `[color-mix(in srgb, {colors.likec4.panel.bg}, #000 calc(var(--seq-r, 0) * ${SHADE_STEP}))]`,
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
        <ActiveTrail ancestors={ancestors} tree={tree} />
        <OutlineNodes
          nodes={tree}
          depth={0}
          activeStep={activeStep}
          activeDepth={activeDepth}
          ancestors={ancestors} />
      </ScrollArea>
    </>
  )
}

/** Sticky "you are here" trail: the fragments the active step is nested inside. */
const ActiveTrail = ({ ancestors, tree }: { ancestors: readonly string[]; tree: OutlineTreeNodeData[] }) => {
  const trail = collectTrail(tree, ancestors)
  // At the root you are not inside anything — the toolbar label already says where you are.
  if (trail.length === 0) return null
  return (
    <HStack
      css={{
        position: 'sticky',
        top: '0',
        zIndex: 'sticky',
        gap: '1.5',
        flexWrap: 'wrap',
        marginInline: '-2',
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
        const { paletteClass, tag } = flowPresentation[node.nodeProps.type as FlowType]
        const label = node.nodeProps.title ? `${tag} ${node.nodeProps.title}` : tag
        const last = i === trail.length - 1
        return (
          <Fragment key={node.value}>
            {i > 0 && <IconChevronRight size={10} />}
            {last
              ? (
                <styled.b
                  className={paletteClass}
                  css={{ fontWeight: 'extrabold', color: 'colorPalette.text' }}>
                  {label}
                </styled.b>
              )
              : <span>{label}</span>}
          </Fragment>
        )
      })}
    </HStack>
  )
}

function collectTrail(nodes: OutlineTreeNodeData[], ancestors: readonly string[]) {
  const trail: Extract<OutlineTreeNodeData, { children: OutlineTreeNodeData[] }>[] = []
  const walk = (list: OutlineTreeNodeData[]) => {
    for (const node of list) {
      if (isOutlineFlowNode(node) && ancestors.includes(node.value)) {
        trail.push(node)
        walk(node.children)
        return
      }
    }
  }
  walk(nodes)
  return trail
}

type OutlineNodesProps = {
  nodes: OutlineTreeNodeData[]
  depth: number
  activeStep: StepPath
  activeDepth: number
  ancestors: readonly string[]
}

const OutlineNodes = ({ nodes, depth, activeStep, activeDepth, ancestors }: OutlineNodesProps) => {
  const recession = recessionOf(depth, activeDepth)

  return (
    <>
      {nodes.map(node => {
        if (!isOutlineFlowNode(node)) {
          return (
            <StepRow
              key={node.value}
              node={node}
              active={node.value === activeStep}
              recession={recession} />
          )
        }
        const onPath = ancestors.includes(node.value)
        const innerDistance = activeDepth - (depth + 1)
        const innerRecession = recessionOf(depth + 1, activeDepth)
        const { paletteClass } = flowPresentation[node.nodeProps.type as FlowType]

        return (
          <Box
            key={node.value}
            className={cx(
              paletteClass,
              css(
                levelBand,
                innerDistance < 0 && nestedBand,
                innerDistance === 0 && onPath && activeFrame,
              ),
            )}
            style={{
              ['--seq-r' as string]: innerRecession,
              ['--seq-frame-bg' as string]: 'var(--colors-color-palette)',
              ['--seq-badge-bg' as string]: 'var(--colors-color-palette-text)',
              ['--seq-badge-fg' as string]: 'var(--colors-likec4-panel-bg)',
            }}
          >
            <FlowRow node={node} recession={recession} />
            <OutlineNodes
              nodes={node.children}
              depth={depth + 1}
              activeStep={activeStep}
              activeDepth={activeDepth}
              ancestors={ancestors} />
          </Box>
        )
      })}
    </>
  )
}

// -----------------------------------------------------------------------------
// Rows
// -----------------------------------------------------------------------------

type StepNode = Extract<OutlineTreeNodeData, { nodeProps: { type: 'step' } }>

const StepRow = ({ node, active, recession }: { node: StepNode; active: boolean; recession: number }) => {
  const diagram = useDiagram()
  const { stepnum, source, target, label, notes } = node.nodeProps

  if (active) {
    return <ActiveStepCard node={node} />
  }

  return (
    <HStack
      css={css.raw(recessed, {
        alignItems: 'baseline',
        gap: '2',
        width: '100%',
        paddingInline: '1.5',
        paddingBlock: '1',
        rounded: 'md',
        cursor: 'pointer',
        color: 'text',
        userSelect: 'none',
        _hover: {
          background: '[var(--colors-color-palette-hovered, {colors.surface.sunken})]',
        },
      })}
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
    </HStack>
  )
}

/** The step you are on: lifted onto its own surface, with room for its notes. */
const ActiveStepCard = ({ node }: { node: StepNode }) => {
  const ref = useRef<HTMLDivElement>(null)
  const { stepnum, source, target, label, notes } = node.nodeProps

  useEffect(() => {
    ref.current?.scrollIntoView({
      block: 'nearest',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }, [node.value])

  return (
    <Box
      ref={ref}
      css={{
        marginBlock: '2',
        paddingInline: '3',
        paddingBlock: '2.5',
        rounded: 'md',
        background: '[var(--colors-color-palette-label, {colors.surface.sunken})]',
        boxShadow: 'md',
        cursor: 'default',
        _reduceGraphicsOnPan: {
          boxShadow: 'none',
          outline: '[1px solid {colors.border.subtle}]',
        },
      }}
    >
      <HStack css={{ alignItems: 'baseline', gap: '2', width: '100%' }}>
        <StepBadge active>{stepnum}</StepBadge>
        <styled.span
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
      </HStack>
      {label && (
        <styled.div
          css={{
            marginTop: '1',
            marginLeft: '[30px]',
            textStyle: 'dimmed.xxs',
            color: '[color-mix(in srgb, {colors.text}, transparent 20%)]',
            fontWeight: 'medium',
            letterSpacing: 'caps.sm',
            textTransform: 'uppercase',
            userSelect: 'none',
          }}>
          {source}
          <IconArrowRight
            size={12}
            className={css({
              display: 'inline',
              verticalAlign: '[-0.15em]',
              marginInline: '1',
            })} />
          {target}
        </styled.div>
      )}
      {notes && (
        <Markdown
          value={RichText.from(notes)}
          fontSize={'sm'}
          textScale={0.95}
          className={css({
            marginTop: '2.5',
            paddingTop: '2.5',
            borderTop: 'subtle',
            color: 'text',
          })}
        />
      )}
    </Box>
  )
}

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

const stepBadgeActive = css.raw({
  minWidth: '[22px]',
  height: '[20px]',
  // Composited over the panel rather than the tinted card, so the alpha lands predictably.
  background: '[linear-gradient(var(--seq-badge-bg), var(--seq-badge-bg)), {colors.likec4.panel.bg}]',
  color: '[var(--seq-badge-fg)]',
  fontSize: '[11px]',
})

const StepBadge = ({ children, active }: { children: ReactNode; active?: boolean }) => (
  <div className={css(stepBadgeBase, active && stepBadgeActive)}>{children}</div>
)

/** Marks a step that carries notes, without letting the note reflow the list. */
const NotesDot = () => (
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

type FlowNode = Extract<OutlineTreeNodeData, { children: OutlineTreeNodeData[] }>

const FlowRow = ({ node, recession }: { node: FlowNode; recession: number }) => {
  const { tag, Icon } = flowPresentation[node.nodeProps.type as FlowType]
  return (
    <HStack
      css={css.raw(recessed, {
        alignItems: 'center',
        gap: '1.5',
        marginTop: '2',
        marginBottom: '0.5',
        paddingInline: '1.5',
        paddingBlock: '0.5',
        color: 'text',
        userSelect: 'none',
      })}
      style={{ ['--seq-r' as string]: recession }}
    >
      <Icon size={13} className={css({ flex: 'none', color: 'colorPalette.text' })} />
      <styled.span
        css={{
          flex: '1',
          minWidth: '0',
          fontSize: 'xs',
          fontWeight: 'medium',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
        {node.nodeProps.title ?? tag}
      </styled.span>
      <FlowTag>{tag}</FlowTag>
    </HStack>
  )
}

/** Small pill tag for the sub-flow operator (`loop`, `par`, `try`, …). */
const flowTagBase = css.raw({
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
})

const FlowTag = ({ children, dimmed }: { children: ReactNode; dimmed?: boolean }) => (
  <div className={css(flowTagBase, dimmed && { opacity: '[0.7]' })}>{children}</div>
)
