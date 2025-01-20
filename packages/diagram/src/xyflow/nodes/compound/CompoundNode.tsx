import { type ThemeColor, DiagramNode } from '@likec4/core'
import { Box, Text } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import { type NodeProps, Handle, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual as eq } from 'fast-equals'
import { m } from 'framer-motion'
import { memo, useState } from 'react'
import { clamp } from 'remeda'
import { ActionButtonBar } from '../../../controls/action-button-bar/ActionButtonBar'
import { NavigateToButton, OpenDetailsButton } from '../../../controls/action-buttons/ActionButtons'
import { useDiagramState } from '../../../hooks/useDiagramState'
import type { DiagramFlowTypes } from '../../types'
import { toDomPrecision } from '../../utils'
import { type VariantKeys, NodeVariants, useFramerAnimateVariants } from '../AnimateVariants'
import * as nodeCss from '../Node.css'
import { ElementIcon } from '../shared/ElementIcon'
import { CompoundToolbar } from '../shared/Toolbar'
import * as css from './CompoundNode.css'

type CompoundNodeProps = NodeProps<DiagramFlowTypes.CompoundNode>

const isEqualProps = (prev: CompoundNodeProps, next: CompoundNodeProps) => (
  prev.id === next.id
  && eq(prev.selected ?? false, next.selected ?? false)
  && eq(prev.dragging ?? false, next.dragging ?? false)
  && eq(prev.data, next.data)
)

export const CompoundNodeMemo = /* @__PURE__ */ memo<CompoundNodeProps>((
  {
    id,
    selected = false,
    dragging = false,
    data: {
      isViewGroup,
      element,
    },
    width,
    height,
  },
) => {
  const modelRef = DiagramNode.modelRef(element)
  const { depth, style, color } = element
  const isNotViewGroup = !isViewGroup
  const opacity = clamp((style.opacity ?? 100) / 100, {
    min: 0,
    max: 1,
  })
  const MAX_TRANSPARENCY = 40
  const borderTransparency = clamp(MAX_TRANSPARENCY - opacity * MAX_TRANSPARENCY, {
    min: 0,
    max: MAX_TRANSPARENCY,
  })

  const {
    viewId,
    isEditable,
    isDimmed,
    isInteractive,
    isNavigable,
    renderIcon,
    isInActiveOverlay,
    enableElementDetails,
    getSelectedNodeIds,
  } = useDiagramState(s => ({
    viewId: s.view.id,
    isEditable: s.readonly !== true,
    isDimmed: s.dimmed.has(id),
    isInteractive: s.nodesDraggable || s.nodesSelectable || s.enableElementDetails
      || (!!s.onNavigateTo && !!element.navigateTo),
    // If this is a view group, we don't want to show the navigate button
    isNavigable: isNotViewGroup && !!s.onNavigateTo && !!element.navigateTo,
    renderIcon: s.renderIcon,
    isInActiveOverlay: (s.activeOverlay?.elementDetails ?? s.activeOverlay?.relationshipsOf) === id,
    enableElementDetails: isNotViewGroup && s.enableElementDetails,
    getSelectedNodeIds: s.getSelectedNodeIds,
  }))

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

  const isHovered = Array.isArray(animateVariant) && animateVariant.includes('hovered')

  const _isToolbarVisible = isNotViewGroup && ((selected && !dragging && getSelectedNodeIds().length === 1) || isHovered)
  // TODO: This is a workaround to prevent the toolbar from flickering when the node unhovered
  const [isToolbarVisible] = useDebouncedValue(_isToolbarVisible, _isToolbarVisible ? 500 : 1000)

  const nodeVariants = NodeVariants(w, h, {
    selectedScaleBy: 0,
    hoveredScaleBy: 0,
    tapScaleBy: -10,
  })

  const [previewColor, setPreviewColor] = useState<ThemeColor | null>(null)

  const elementIcon = ElementIcon({
    element,
    viewId,
    className: css.elementIcon,
    renderIcon,
  })

  return (
    <>
      {isEditable && (
        <CompoundToolbar
          isVisible={isToolbarVisible}
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
            opacity < 1 && 'likec4-compound-transparent',
          )}
          initial={false}
          variants={nodeVariants}
          animate={animateVariant}
          {...isInteractive && animateHandlers}
          mod={{
            'animate-target': '',
            'compound-depth': depth,
            'likec4-color': previewColor ?? color,
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
              'likec4-compound',
            )}
            style={{
              ...(opacity < 1 && {
                ...assignInlineVars({
                  [css.varBorderTransparency]: `${borderTransparency}%`,
                  [css.varOpacity]: opacity.toFixed(2),
                }),
                ...style.border === 'none'
                  ? {
                    borderColor: 'transparent',
                  }
                  : {
                    borderStyle: style.border ?? 'dashed',
                  },
              }),
            }}
          >
            <Box
              className={clsx(
                css.compoundTitle,
                isNavigable && css.withNavigation,
                'likec4-compound-title',
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
                <Box className={clsx(nodeCss.topRightBtnContainer)}>
                  <OpenDetailsButton fqn={modelRef} {...isInteractive && animateHandlers} />
                </Box>
              )}
            </Box>
          </Box>
          {isNavigable && (
            <Box className={clsx(nodeCss.topLeftBtnContainer)}>
              <ActionButtonBar shiftX="left">
                <NavigateToButton xynodeId={id} {...isInteractive && animateHandlers} />
              </ActionButtonBar>
            </Box>
          )}
        </Box>
      </Box>
      <Handle type="target" position={Position.Top} className={css.nodeHandlerInCenter} />
      <Handle type="source" position={Position.Top} className={css.nodeHandlerInCenter} />
    </>
  )
}, isEqualProps)
