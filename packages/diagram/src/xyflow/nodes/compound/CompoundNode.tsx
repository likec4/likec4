import { DiagramNode, type ThemeColor } from '@likec4/core'
import { Box, Text } from '@mantine/core'
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
import type { CompoundXYFlowNode } from '../../types'
import { ElementIcon } from '../shared/ElementIcon'
import { CompoundToolbar } from '../shared/Toolbar'
import { useFramerAnimateVariants } from '../use-animate-variants'
import * as css from './CompoundNode.css'
import { ActionButton } from '../../ActionButton/ActionButton'

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
  idle: (_, { translateZ }) => ({
    // Why? translateZ is used to determine state
    ...translateZ !== 0 && {
      transition: {
        delayChildren: .08
      }
    },
    transitionEnd: {
      translateZ: 0
    }
  }),
  selected: {},
  hovered: (_, { translateZ }) => ({
    ...translateZ !== 1 && {
      transition: {
        delayChildren: .08
      }
    },
    transitionEnd: {
      translateZ: 1
    }
  }),
  tap: {}
} satisfies Variants

export const CompoundNodeMemo = /* @__PURE__ */ memo<CompoundNodeProps>((nodeProps: CompoundNodeProps) => {

  const {
    id,
    selected = false,
    dragging = false,
    data: {
      isViewGroup,
      element
    }
  } = nodeProps

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
    isHovered,
    isDimmed,
    isInteractive,
    isNavigable,
    renderIcon,
    enableElementDetails
  } = useDiagramState(s => ({
    viewId: s.view.id,
    triggerOnNavigateTo: s.triggerOnNavigateTo,
    openOverlay: s.openOverlay,
    isEditable: s.readonly !== true,
    isHovered: s.hoveredNodeId === id,
    isDimmed: s.dimmed.has(id),
    isInteractive: s.nodesDraggable || s.nodesSelectable || s.enableElementDetails
      || (!!s.onNavigateTo && !!element.navigateTo),
    // If this is a view group, we don't want to show the navigate button
    isNavigable: isNotViewGroup && !!s.onNavigateTo && !!element.navigateTo,
    renderIcon: s.renderIcon,
    enableElementDetails: isNotViewGroup && s.enableElementDetails
  }))
  const _isToolbarVisible = isNotViewGroup && isEditable && (isHovered || (import.meta.env.DEV && selected))
  const [isToolbarVisible] = useDebouncedValue(_isToolbarVisible, _isToolbarVisible ? 500 : 300)

  const [animateVariant, animateHandlers] = useFramerAnimateVariants(nodeProps)

  const [previewColor, setPreviewColor] = useState<ThemeColor | null>(null)

  const onNavigateTo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    triggerOnNavigateTo(element.id, e)
  }, [triggerOnNavigateTo, element.id])

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
        variants={VariantsRoot}
        key={`${viewId}:element:${id}`}
        layoutId={`${viewId}:element:${id}`}
        className={css.containerForFramer}>
        <Box
          component={m.div}
          variants={VariantsRoot}
          initial={false}
          animate={animateVariant}
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
                <Box className={clsx(css.detailsBtnContainer)}>
                  <ActionButton
                    key="details"
                    onClick={onOpenDetails}
                    IconComponent={IconId}
                    tooltipLabel='Open details'
                    {...isInteractive && animateHandlers}
                    />
                </Box>
              )}
            </Box>
          </Box>
          {isNavigable && (
            <Box className={clsx(css.navigateBtnContainer)}>
              <ActionButton
                key={"${id}navigate"}
                onClick={onNavigateTo}
                IconComponent={IconZoomScan}
                tooltipLabel='Open scoped view'
                {...isInteractive && animateHandlers}
                />
            </Box>
          )}
        </Box>
      </Box>
      <Handle type="target" position={Position.Top} className={css.nodeHandlerInCenter} />
      <Handle type="source" position={Position.Top} className={css.nodeHandlerInCenter} />
    </>
  )
}, isEqualProps)
