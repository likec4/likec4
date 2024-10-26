import { type ThemeColor } from '@likec4/core'
import { ActionIcon, Box, Text, Tooltip } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconTransform, IconZoomScan } from '@tabler/icons-react'
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
  idle: (_, { translateY }) => ({
    translateX: 0,
    translateY: 0,
    transition: isNumber(translateY) && translateY < 0
      ? {
        delay: 0.09,
        delayChildren: 0.1,
        staggerChildren: 0.08,
        staggerDirection: -1
      }
      : {}
  }),
  selected: {},
  hovered: (_, { translateY }) => ({
    translateX: -1,
    translateY: -1,
    transition: !isNumber(translateY) || translateY === 0
      ? {
        delay: 0.08,
        delayChildren: 0.09,
        staggerChildren: 0.15
      }
      : {}
  }),
  tap: {}
} satisfies Variants

const VariantsNavigate = {
  idle: {
    '--ai-bg': 'var(--ai-bg-idle)',
    scale: 1,
    opacity: 0.8,
    translateX: 0,
    translateY: 0
  },
  hovered: {
    display: 'block',
    '--ai-bg': 'var(--ai-bg-hover)',
    scale: 1.35,
    opacity: 1,
    translateX: -6,
    translateY: 2
  },
  'hovered:navigate': {
    scale: 1.4
  },
  'hovered:relations': {},
  'tap:navigate': {
    scale: 1.15
  }
} satisfies Variants

const VariantsRelationsBtn = {
  idle: {
    '--ai-bg': 'var(--ai-bg-idle)',
    scale: 1,
    opacity: 0,
    translateX: 2,
    translateY: -8,
    transitionEnd: {
      display: 'none'
    }
  },
  hovered: {
    display: 'block',
    '--ai-bg': 'var(--ai-bg-hover)',
    scale: 1.2,
    opacity: 1,
    translateX: -5,
    translateY: 2
  },
  'hovered:relations': {
    scale: 1.42
  },
  'tap:relations': {
    scale: 1.15
  }
} satisfies Variants

/**
 * Variants for the relationships button (when Navigate button is not visible)
 */
const VariantsRelationsBtnSingle = {
  ...VariantsNavigate,
  idle: {
    ...VariantsNavigate.idle,
    opacity: 0,
    transitionEnd: {
      display: 'none'
    }
  }
}

export const CompoundNodeMemo = /* @__PURE__ */ memo<CompoundNodeProps>(function CompoundNode({
  id,
  selected = false,
  dragging = false,
  data: {
    isViewGroup,
    element
  }
}) {
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
    triggerOnNavigateTo,
    openOverlay,
    isEditable,
    isHovered,
    isDimmed,
    isInteractive,
    hasOnNavigateTo,
    enableRelationshipsMode
  } = useDiagramState(s => ({
    triggerOnNavigateTo: s.triggerOnNavigateTo,
    openOverlay: s.openOverlay,
    isEditable: s.readonly !== true,
    isHovered: s.hoveredNodeId === id,
    isDimmed: s.dimmed.has(id),
    isInteractive: s.nodesDraggable || s.nodesSelectable || s.enableRelationshipsBrowser
      || (!!s.onNavigateTo && !!element.navigateTo),
    hasOnNavigateTo: !!s.onNavigateTo,
    enableRelationshipsMode: s.enableRelationshipsBrowser
  }))
  // If this is a view group, we don't want to show the navigate button
  const isNavigable = isNotViewGroup && !!element.navigateTo && hasOnNavigateTo
  const hasRelationshipsBrowser = isNotViewGroup && enableRelationshipsMode

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

  const onBrowseRelations = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    openOverlay({ relationshipsOf: element.id })
  }, [openOverlay, element.id])

  return (
    <>
      {isToolbarVisible && (
        <CompoundToolbar
          isVisible={isToolbarVisible}
          element={element}
          align="start"
          onColorPreview={setPreviewColor} />
      )}
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
        <div
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
          <Text
            component="div"
            className={clsx(
              css.title,
              (isNavigable || hasRelationshipsBrowser) && css.titleWithNavigation,
              'likec4-compound-title'
            )}>
            {element.title}
          </Text>
        </div>
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
            <IconZoomScan stroke={1.8} style={{ width: '75%' }} />
          </ActionIcon>
        )}
        {hasRelationshipsBrowser && (
          <Tooltip
            fz="xs"
            color="dark"
            label="Browse relationships"
            withinPortal={false}
            openDelay={600}
            position="right">
            <ActionIcon
              component={m.div}
              // Is is a second button, so we need to use a different variant
              key={isNavigable ? 'relations' : 'relations-as-navigate'}
              variants={isNavigable ? VariantsRelationsBtn : VariantsRelationsBtnSingle}
              data-animate-target={isNavigable ? 'relations' : 'navigate'}
              className={clsx('nodrag nopan', css.navigateBtn)}
              radius="md"
              style={{
                top: isNavigable ? 50 : undefined,
                zIndex: 99
              }}
              role="button"
              onClick={onBrowseRelations}
              onDoubleClick={stopPropagation}
              {...isInteractive && animateHandlers}
            >
              <IconTransform stroke={1.8} style={{ width: '66%' }} />
            </ActionIcon>
          </Tooltip>
        )}
      </Box>
      <Handle type="target" position={Position.Top} className={css.nodeHandlerInCenter} />
      <Handle type="source" position={Position.Top} className={css.nodeHandlerInCenter} />
    </>
  )
}, isEqualProps)
