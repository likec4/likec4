import { DiagramNode, type ThemeColor } from '@likec4/core'
import { ActionIcon, Box, Text, Tooltip } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconId, IconZoomScan } from '@tabler/icons-react'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual as eq } from 'fast-equals'
import { m, type Variants } from 'framer-motion'
import { memo, useCallback, useState } from 'react'
import { clamp } from 'remeda'
import { useDiagramState } from '../../../hooks/useDiagramState'
import { stopPropagation, toDomPrecision } from '../../utils'
import { ElementIcon } from '../shared/ElementIcon'
import { CompoundToolbar } from '../shared/Toolbar'
import { NodeVariants, useFramerAnimateVariants, type VariantKeys } from '../AnimateVariants'
import * as css from './CompoundNode.css'
import type { DiagramFlowTypes } from '../../types'

type CompoundNodeProps = NodeProps<DiagramFlowTypes.CompoundNode>

const isEqualProps = (prev: CompoundNodeProps, next: CompoundNodeProps) => (
  prev.id === next.id
  && eq(prev.selected ?? false, next.selected ?? false)
  && eq(prev.dragging ?? false, next.dragging ?? false)
  && eq(prev.data, next.data)
)

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
  'hovered:details': {},
  'tap:navigate': {
    scale: 1.15
  }
} satisfies Variants
VariantsNavigate['selected'] = VariantsNavigate.hovered
VariantsNavigate['hovered:details'] = VariantsNavigate.idle

const VariantsDetailsBtn = {
  idle: {
    '--ai-bg': 'var(--ai-bg-idle)',
    scale: 1,
    opacity: 0.3,
    originX: 0.45,
    originY: 0.55
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
    },
    width,
    height
  }
) => {
  const modelRef = DiagramNode.modelRef(element)
  const { depth, style, color } = element
  const isNotViewGroup = !isViewGroup
  const opacity = clamp((style.opacity ?? 100) / 100, {
    min: 0,
    max: 1
  })
  const MAX_TRANSPARENCY = 40
  const borderTransparency = clamp(MAX_TRANSPARENCY - opacity * MAX_TRANSPARENCY, {
    min: 0,
    max: MAX_TRANSPARENCY
  })

  const {
    viewId,
    triggerOnNavigateTo,
    openOverlay,
    isEditable,
    isDimmed,
    isInteractive,
    isNavigable,
    renderIcon,
    isInActiveOverlay,
    enableElementDetails
  } = useDiagramState(s => ({
    viewId: s.view.id,
    triggerOnNavigateTo: s.triggerOnNavigateTo,
    openOverlay: s.openOverlay,
    isEditable: s.readonly !== true,
    isDimmed: s.dimmed.has(id),
    isInteractive: s.nodesDraggable || s.nodesSelectable || s.enableElementDetails
      || (!!s.onNavigateTo && !!element.navigateTo),
    // If this is a view group, we don't want to show the navigate button
    isNavigable: isNotViewGroup && !!s.onNavigateTo && !!element.navigateTo,
    renderIcon: s.renderIcon,
    isInActiveOverlay: (s.activeOverlay?.elementDetails ?? s.activeOverlay?.relationshipsOf) === id,
    enableElementDetails: isNotViewGroup && s.enableElementDetails
  }))
  const _isToolbarVisible = isNotViewGroup && isEditable && import.meta.env.DEV && selected
  const [isToolbarVisible] = useDebouncedValue(_isToolbarVisible, _isToolbarVisible ? 500 : 300)

  const w = toDomPrecision(width ?? element.width)
  const h = toDomPrecision(height ?? element.height)

  let animateVariant: VariantKeys | string[]
  switch (true) {
    case isInActiveOverlay:
      animateVariant = 'idle'
      break
    case dragging && selected:
      animateVariant = 'selected'
      break
    case dragging:
      animateVariant = 'idle'
      break
    case isDimmed:
      animateVariant = 'dimmed'
      break
    case selected:
      animateVariant = 'selected'
      break
    default:
      animateVariant = 'idle'
  }

  const [animateVariants, animateHandlers] = useFramerAnimateVariants()
  if (!dragging && !isInActiveOverlay) {
    animateVariant = animateVariants ?? animateVariant
  }

  const nodeVariants = NodeVariants(w, h)

  const [previewColor, setPreviewColor] = useState<ThemeColor | null>(null)

  const onNavigateTo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    triggerOnNavigateTo(id, e)
  }, [triggerOnNavigateTo, id])

  const onOpenDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    openOverlay({ elementDetails: element.id })
  }, [openOverlay, element])

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
        variants={nodeVariants}
        key={`${viewId}:element:${id}`}
        layoutId={`${viewId}:element:${id}`}
        className={css.containerForFramer}>
        <Box
          component={m.div}
          className={clsx(
            css.container,
            'likec4-compound-node',
            opacity < 1 && 'likec4-compound-transparent'
          )}

          initial={false}
          variants={nodeVariants}
          animate={animateVariant}
          whileHover={selected ? "selected" : "hovered"}
          {...isInteractive && animateHandlers}

          mod={{
            'animate-target': '',
            'compound-depth': depth,
            'likec4-color': previewColor ?? color
          }}
          tabIndex={-1}
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
                ...style.border === 'none'
                  ? {
                    borderColor: 'transparent'
                  }
                  : {
                    borderStyle: style.border ?? 'dashed'
                  }
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
              {enableElementDetails && !!modelRef && (
                <Tooltip
                  fz="xs"
                  color="dark"
                  label="Open details"
                  withinPortal={false}
                  offset={2}
                  openDelay={600}>
                  <ActionIcon
                    key={`${id}details`}
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
              key={`${id}navigate`}
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
