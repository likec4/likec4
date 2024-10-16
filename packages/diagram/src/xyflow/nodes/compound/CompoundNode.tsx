import type { ThemeColor } from '@likec4/core'
import { ActionIcon, Box, Text, Tooltip } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconTransform, IconZoomScan } from '@tabler/icons-react'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual as eq } from 'fast-equals'
import { m, type Variants } from 'framer-motion'
import { memo, useCallback, useMemo, useState } from 'react'
import { clamp, isNumber } from 'remeda'
import { useDiagramState } from '../../../hooks/useDiagramState'
import type { CompoundXYFlowNode } from '../../types'
import { stopPropagation } from '../../utils'
import { CompoundToolbar } from '../shared/Toolbar'
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
        delay: 0.15,
        delayChildren: 0.16,
        staggerChildren: 0.09
      }
      : {}
  }),
  tap: {}
} satisfies Variants

const VariantsNavigate = {
  idle: {
    '--ai-bg': 'var(--ai-bg-idle)',
    scale: 0.98,
    opacity: 0.8,
    originX: 0.8,
    translateX: 0
  },
  hovered: {
    '--ai-bg': 'var(--ai-bg-hover)',
    scale: 1.25,
    opacity: 1,
    originX: 0.8,
    translateX: -2
  },
  'hovered:navigate': {
    scale: 1.4
  },
  'hovered:relations': {},
  'tap:navigate': {
    scale: 0.975
  }
} satisfies Variants

const VariantsRelationsBtn = {
  idle: {
    '--ai-bg': 'var(--ai-bg-idle)',
    scale: 0.8,
    opacity: 0,
    translateX: 1,
    translateY: -7,
    originX: 0.8,
    originY: 0.4,
    transitionEnd: {
      display: 'none'
    }
  },
  hovered: {
    display: 'block',
    '--ai-bg': 'var(--ai-bg-hover)',
    scale: 1.25,
    opacity: 1,
    originX: 0.8,
    originY: 0.4,
    translateX: -2,
    translateY: 2
  },
  'hovered:navigate': {
    translateY: 4
  },
  'hovered:relations': {
    scale: 1.4,
    translateY: 2
  },
  'tap:relations': {
    scale: 0.975
  }
} satisfies Variants

type VariantLabel = keyof typeof VariantsRoot | keyof typeof VariantsNavigate | keyof typeof VariantsRelationsBtn

export const CompoundNodeMemo = /* @__PURE__ */ memo<CompoundNodeProps>(function CompoundNode({
  id,
  selected = false,
  dragging = false,
  data: {
    element: {
      color,
      style,
      depth = 1,
      ...element
    }
  }
}) {
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
    hasOnNavigateTo,
    enableRelationshipsMode
  } = useDiagramState(s => ({
    triggerOnNavigateTo: s.triggerOnNavigateTo,
    openOverlay: s.openOverlay,
    isEditable: s.readonly !== true,
    isHovered: s.hoveredNodeId === id,
    isDimmed: s.dimmed.has(id),
    hasOnNavigateTo: !!s.onNavigateTo,
    enableRelationshipsMode: s.enableRelationshipsBrowser
  }))
  const isNavigable = !!element.navigateTo && hasOnNavigateTo

  const _isToolbarVisible = isEditable && (isHovered || (import.meta.env.DEV && selected))
  const [isToolbarVisible] = useDebouncedValue(_isToolbarVisible, _isToolbarVisible ? 500 : 300)

  const [animateVariants, setAnimateVariants] = useState<VariantLabel[] | null>(null)

  const animateHandlers = useMemo(() => {
    const getTarget = (e: MouseEvent) =>
      (e.target as HTMLElement).closest('[data-animate-target]')?.getAttribute('data-animate-target')
    const onHoverStart = (e: MouseEvent) => {
      const hoverTarget = getTarget(e)
      if (hoverTarget) {
        setAnimateVariants(['hovered', `hovered:${hoverTarget}` as VariantLabel])
      } else {
        setAnimateVariants(null)
      }
    }
    return ({
      onTapStart: (e: MouseEvent) => {
        const tapTarget = getTarget(e)
        setAnimateVariants([
          'hovered',
          `hovered:${tapTarget}` as VariantLabel,
          `tap:${tapTarget}` as VariantLabel
        ])
      },
      onHoverStart,
      onHoverEnd: () => setAnimateVariants(null),
      onTapCancel: () => setAnimateVariants(null),
      onTap: (e: MouseEvent) => {
        onHoverStart(e)
      }
    })
  }, [setAnimateVariants])

  let animate: keyof typeof VariantsRoot = 'idle'
  switch (true) {
    case dragging && selected:
      animate = 'selected'
      break
    case dragging:
      animate = 'idle'
      break
    case isHovered:
      animate = 'hovered'
      break
    case selected:
      animate = 'selected'
      break
  }

  const [previewColor, setPreviewColor] = useState<ThemeColor | null>(null)

  const onNavigateTo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setTimeout(() => triggerOnNavigateTo(element.id, e), 50)
  }, [triggerOnNavigateTo, element.id])

  const onBrowseRelations = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    // Delay the opening of the overlay to allow the hover animation to play
    setTimeout(() =>
      openOverlay({
        relationshipsOf: element.id
      }), 200)
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
        animate={animateVariants ?? animate}
        variants={VariantsRoot}
        initial={false}
        className={clsx(
          css.container,
          'likec4-compound-node',
          opacity < 1 && 'likec4-compound-transparent',
          isDimmed && css.dimmed
        )}
        mod={{
          'compound-depth': depth,
          'likec4-color': previewColor ?? color,
          hovered: isHovered
        }}
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
              (isNavigable || enableRelationshipsMode) && css.titleWithNavigation,
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
            {...animateHandlers}
          >
            <IconZoomScan stroke={1.8} style={{ width: '75%' }} />
          </ActionIcon>
        )}
        {enableRelationshipsMode && (
          <Tooltip fz="xs" color="dark" label="Browse relationships" withinPortal={false} openDelay={600}>
            <ActionIcon
              key={isNavigable ? 'relations' : 'relations-as-navigate'}
              component={m.div}
              // Is is a second button, so we need to use a different variant
              variants={isNavigable ? VariantsRelationsBtn : VariantsNavigate}
              data-animate-target={isNavigable ? 'relations' : 'navigate'}
              className={clsx('nodrag nopan', css.navigateBtn)}
              radius="md"
              style={{
                top: isNavigable ? 44 : undefined,
                zIndex: 99
              }}
              role="button"
              onClick={onBrowseRelations}
              onDoubleClick={stopPropagation}
              {...animateHandlers}
            >
              <IconTransform stroke={1.8} style={{ width: '75%' }} />
            </ActionIcon>
          </Tooltip>
        )}
      </Box>
      <Handle type="target" position={Position.Top} className={css.nodeHandlerInCenter} />
      <Handle type="source" position={Position.Top} className={css.nodeHandlerInCenter} />
    </>
  )
}, isEqualProps)
