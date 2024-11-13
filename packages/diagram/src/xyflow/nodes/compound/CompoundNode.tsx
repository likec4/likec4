import { type ThemeColor } from '@likec4/core'
import { ActionIcon, Box, Text, Tooltip } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconId, IconTransform, IconZoomScan } from '@tabler/icons-react'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual as eq } from 'fast-equals'
import { m, type Variants } from 'framer-motion'
import { memo, useCallback, useState } from 'react'
import { clamp, isNumber } from 'remeda'
import { useDiagramState } from '../../../hooks/useDiagramState'
import type { CompoundXYFlowNode } from '../../types'
import { stopPropagation } from '../../utils'
import { ElementIcon } from '../shared/ElementIcon'
import { CompoundToolbar } from '../shared/Toolbar'
import { useFramerAnimateVariants } from '../use-animate-variants'
import * as css from './CompoundNode.css'

type CompoundNodeProps = Pick<
  NodeProps<CompoundXYFlowNode>,
  'id' | 'data' | 'selected' | 'dragging'
>

const isEqualProps = (prev: CompoundNodeProps, next: CompoundNodeProps) => (
  prev.id === next.id
  && eq(prev.selected ?? false, next.selected ?? false)
  && eq(prev.dragging ?? false, next.dragging ?? false)
  && eq(prev.data, next.data)
)

const VariantsRoot = {
  idle: {
    transition: {
      delayChildren: .1
      // stagger
    }
  },
  selected: {},
  hovered: {},
  tap: {}
} satisfies Variants

const VariantsNavigate = {
  idle: {
    '--ai-bg': 'var(--ai-bg-idle)',
    scale: 1,
    opacity: 0.8,
    originX: 1,
    originY: 0.25,
    translateX: 0,
    translateY: 0
  },
  selected: {},
  hovered: {
    '--ai-bg': 'var(--ai-bg-hover)',
    scale: 1.25,
    opacity: 1,
    translateX: -1
  },
  'hovered:navigate': {
    scale: 1.42
  },
  'hovered:relations': {},
  'tap:navigate': {
    scale: 1.15
  }
} satisfies Variants
VariantsNavigate['selected'] = VariantsNavigate['hovered']

const VariantsDetailsBtn = {
  idle: {
    '--ai-bg': 'var(--ai-bg-idle)',
    scale: 1,
    opacity: 0.3
  },
  selected: {},
  hovered: {
    scale: 1.2,
    opacity: 0.6
  },
  'hovered:details': {
    scale: 1.42,
    opacity: 1
  },
  'tap:details': {
    scale: 1.15
  }
} satisfies Variants
VariantsDetailsBtn['selected'] = VariantsDetailsBtn['hovered']

export const CompoundNodeMemo = /* @__PURE__ */ memo<CompoundNodeProps>((
  {
    id,
    selected = false,
    dragging = false,
    data: {
      isViewGroup,
      element
    }
  }
) => {
  const { depth, style, color } = element
  const isNotViewGroup = !isViewGroup
  const opacity = clamp((style.opacity ?? 100) / 100, {
    min: 0,
    max: 1
  })
  const borderTransparency = clamp(50 - opacity * 50, {
    min: 0,
    max: 50
  })

  const {
    viewId,
    triggerOnNavigateTo,
    openOverlay,
    isEditable,
    isHovered,
    isDimmed,
    isInteractive,
    hasOnNavigateTo,
    renderIcon,
    enableElementDetails
  } = useDiagramState(s => ({
    viewId: s.view.id,
    triggerOnNavigateTo: s.triggerOnNavigateTo,
    openOverlay: s.openOverlay,
    isEditable: s.readonly !== true,
    isHovered: s.hoveredNodeId === id,
    isDimmed: s.dimmed.has(id),
    isInteractive: s.nodesDraggable || s.nodesSelectable || s.enableRelationshipBrowser
      || (!!s.onNavigateTo && !!element.navigateTo),
    hasOnNavigateTo: !!s.onNavigateTo,
    renderIcon: s.renderIcon,
    enableElementDetails: s.enableElementDetails
  }))
  // If this is a view group, we don't want to show the navigate button
  const isNavigable = isNotViewGroup && !!element.navigateTo && hasOnNavigateTo
  const hasElementDetails = isNotViewGroup && enableElementDetails

  const _isToolbarVisible = isNotViewGroup && isEditable && (isHovered || (import.meta.env.DEV && selected))
  const [isToolbarVisible] = useDebouncedValue(_isToolbarVisible, _isToolbarVisible ? 500 : 300)

  const [animateVariants, animateHandlers] = useFramerAnimateVariants()

  let animate: keyof typeof VariantsRoot
  switch (true) {
    case dragging && selected:
      animate = 'selected'
      break
    case dragging:
      animate = 'idle'
      break
    case isInteractive && isHovered:
      animate = 'hovered'
      break
    case selected:
      animate = 'selected'
      break
    default:
      animate = 'idle'
  }

  const [previewColor, setPreviewColor] = useState<ThemeColor | null>(null)

  const onNavigateTo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    triggerOnNavigateTo(id, e)
  }, [triggerOnNavigateTo, id])

  const onOpenDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    openOverlay({ elementDetails: element.id })
  }, [openOverlay, element.id])

  const elementIcon = ElementIcon({
    element,
    viewId,
    className: css.elementIcon,
    renderIcon
  })

  return (
    <>
      {isToolbarVisible && (
        <CompoundToolbar
          isVisible
          element={element}
          align="start"
          onColorPreview={setPreviewColor} />
      )}
      <Box
        component={m.div}
        key={`${viewId}:element:${id}`}
        layoutId={`${viewId}:element:${id}`}
        className={css.containerForFramer}>
        <Box
          component={m.div}
          variants={VariantsRoot}
          initial={false}
          animate={(isHovered && !dragging) ? (animateVariants ?? animate) : animate}
          className={clsx(
            css.container,
            'likec4-compound-node',
            opacity < 1 && 'likec4-compound-transparent',
            isDimmed && css.dimmed
          )}
          mod={{
            'animate-target': '',
            'compound-depth': depth,
            'likec4-color': previewColor ?? color,
            hovered: isHovered
          }}
          tabIndex={-1}
          {...(isInteractive && {
            onTapStart: animateHandlers.onTapStart,
            onTap: animateHandlers.onTap,
            onTapCancel: animateHandlers.onTapCancel
          })}
        >
          <svg className={css.indicator}>
            <rect
              x={0}
              y={0}
              width={'100%'}
              height={'100%'}
              rx={6}
            />
          </svg>
          <Box
            className={clsx(
              css.compoundBody,
              opacity < 1 && css.transparent,
              'likec4-compound'
            )}
            style={{
              ...(opacity < 1 && {
                ...assignInlineVars({
                  [css.varBorderTransparency]: `${borderTransparency}%`,
                  [css.varOpacity]: opacity.toFixed(2)
                }),
                borderStyle: style.border ?? 'dashed'
              })
            }}
          >
            <Box
              className={clsx(
                css.compoundTitle,
                isNavigable && css.withNavigation,
                'likec4-compound-title'
              )}>
              {elementIcon}
              <Text
                component={m.div}
                key={`${viewId}:element:title:${id}`}
                layoutId={`${viewId}:element:title:${id}`}
                className={css.title}>
                {element.title}
              </Text>
              {hasElementDetails && (
                <Tooltip
                  fz="xs"
                  color="dark"
                  label="Open details"
                  withinPortal={false}
                  offset={2}
                  openDelay={600}>
                  <ActionIcon
                    component={m.div}
                    variants={VariantsDetailsBtn}
                    data-animate-target="details"
                    className={clsx('nodrag nopan', css.detailsBtn)}
                    radius="md"
                    style={{ zIndex: 100 }}
                    role="button"
                    onClick={onOpenDetails}
                    onDoubleClick={stopPropagation}
                    {...isInteractive && animateHandlers}
                  >
                    <IconId stroke={1.8} style={{ width: '75%' }} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Box>
          </Box>
          {isNavigable && (
            <ActionIcon
              key={'navigate'}
              component={m.div}
              variants={VariantsNavigate}
              data-animate-target="navigate"
              className={clsx('nodrag nopan', css.navigateBtn)}
              radius="md"
              style={{ zIndex: 100 }}
              onClick={onNavigateTo}
              role="button"
              onDoubleClick={stopPropagation}
              {...isInteractive && animateHandlers}
            >
              <IconZoomScan style={{ width: '75%' }} />
            </ActionIcon>
          )}
        </Box>
      </Box>
      <Handle type="target" position={Position.Top} className={css.nodeHandlerInCenter} />
      <Handle type="source" position={Position.Top} className={css.nodeHandlerInCenter} />
    </>
  )
}, isEqualProps)
