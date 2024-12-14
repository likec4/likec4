import { DiagramNode, type ThemeColor } from '@likec4/core'
import { Box, Text as MantineText } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconId } from '@tabler/icons-react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual as eq } from 'fast-equals'
import { m, type Variants } from 'framer-motion'
import React, { memo, useCallback, useState } from 'react'
import { isNumber, isTruthy } from 'remeda'
import { useDiagramState } from '../../../hooks/useDiagramState'
import type { ElementXYFlowNode } from '../../types'
import { toDomPrecision } from '../../utils'
import { ElementIcon } from '../shared/ElementIcon'
import { ElementToolbar } from '../shared/Toolbar'
import { useFramerAnimateVariants } from '../use-animate-variants'
import * as css from './element.css'
import { ElementShapeSvg, SelectedIndicator } from './ElementShapeSvg'
import { BottomButtons } from '../../BottomButtons/BottomButtons'
import { ActionButton } from '../../ActionButton/ActionButton'

const Text = MantineText.withProps({
  component: 'div'
})

const selectedScale = 1.015

// Frame-motion variants

const VariantsRoot = {
  idle: (_, { scale }) => ({
    scale: 1,
    transition: isNumber(scale) && scale > selectedScale
      ? {
        delay: 0.1,
        delayChildren: 0.06
        // staggerChildren: 0.07,
        // staggerDirection: -1
      }
      : {}
  }),
  selected: {
    scale: selectedScale
  },
  hovered: (_, { scale }) => ({
    scale: 1.06,
    transition: !isNumber(scale) || (scale >= 1 && scale < 1.06)
      ? {
        // delay: 0.09,
        delayChildren: 0.08
      }
      : {}
  }),
  tap: {
    scale: 0.975
  }
} satisfies Variants

type ElementNodeProps = NodeProps<ElementXYFlowNode>
const isEqualProps = (prev: ElementNodeProps, next: ElementNodeProps) => (
  prev.id === next.id
  && eq(prev.selected ?? false, next.selected ?? false)
  && eq(prev.dragging ?? false, next.dragging ?? false)
  && eq(prev.width ?? 0, next.width ?? 0)
  && eq(prev.height ?? 0, next.height ?? 0)
  && eq(prev.data, next.data)
)

export const ElementNodeMemo = memo<ElementNodeProps>(function ElementNode({
  id,
  data: {
    element
  },
  dragging,
  selected = false,
  width,
  height
}) {
  const modelRef = DiagramNode.modelRef(element)
  // const deploymentRef = DiagramNode.deploymentRef(element)
  const {
    viewId,
    isEditable,
    isHovered,
    isDimmed,
    isNavigable,
    isInteractive,
    enableElementDetails,
    enableRelationshipBrowser,
    triggerOnNavigateTo,
    openOverlay,
    isInActiveOverlay,
    renderIcon
  } = useDiagramState(s => ({
    viewId: s.view.id,
    isEditable: s.readonly !== true,
    isHovered: s.hoveredNodeId === id,
    isDimmed: s.dimmed.has(id),
    isInteractive: s.nodesDraggable || s.nodesSelectable || s.enableElementDetails || s.enableRelationshipBrowser
      || (!!s.onNavigateTo && !!element.navigateTo),
    isNavigable: (!!s.onNavigateTo && !!element.navigateTo),
    enableElementDetails: s.enableElementDetails,
    enableRelationshipBrowser: s.enableRelationshipBrowser,
    triggerOnNavigateTo: s.triggerOnNavigateTo,
    openOverlay: s.openOverlay,
    isInActiveOverlay: (s.activeOverlay?.elementDetails ?? s.activeOverlay?.relationshipsOf) === id,
    renderIcon: s.renderIcon
  }))
  // For development purposes, show the toolbar when the element is selected
  const isHoveredOrSelected = isHovered || (import.meta.env.DEV && selected)
  const _isToolbarVisible = isEditable && isHoveredOrSelected
  const [isToolbarVisible] = useDebouncedValue(_isToolbarVisible, _isToolbarVisible ? 500 : 300)

  const w = toDomPrecision(width ?? element.width)
  const h = toDomPrecision(height ?? element.height)

  let animateVariant: keyof typeof VariantsRoot | string[]
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
    case isInteractive && isHovered:
      animateVariant = 'hovered'
      break
    case selected:
      animateVariant = 'selected'
      break
    default:
      animateVariant = 'idle'
  }
  const [animateVariants, animateHandlers] = useFramerAnimateVariants()
  if (isHovered && !dragging && !isInActiveOverlay) {
    animateVariant = animateVariants ?? animateVariant
  }

  const elementIcon = ElementIcon({
    element,
    viewId,
    className: css.elementIcon,
    renderIcon
  })

  const [previewColor, setPreviewColor] = useState<ThemeColor | null>(null)

  const onNavigateTo = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    triggerOnNavigateTo(id, e)
  }, [triggerOnNavigateTo, id])

  const onOpenDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    openOverlay({ elementDetails: element.id })
  }, [openOverlay, element.id])

  const onOpenRelationships = useCallback((e: React.MouseEvent) => {
    if (modelRef) {
      e.stopPropagation()
      openOverlay({ relationshipsOf: modelRef })
    }
  }, [openOverlay, modelRef])

  return (
    <>
      {isToolbarVisible && (
        <ElementToolbar
          element={element}
          isVisible={isToolbarVisible}
          onColorPreview={setPreviewColor}
        />
      )}
      <Box
        component={m.div}
        className={clsx([
          css.container,
          isDimmed && css.dimmed,
          animateVariant !== 'idle' && css.containerAnimated,
          'likec4-element-node'
        ])}
        key={`${viewId}:element:${id}`}
        layoutId={`${viewId}:element:${id}`}
        data-hovered={!dragging && isHovered}
        data-likec4-color={previewColor ?? element.color}
        data-likec4-shape={element.shape}
        data-animate-target=""
        initial={false}
        variants={VariantsRoot}
        animate={animateVariant}
        tabIndex={-1}
        {...(isInteractive && {
          onTapStart: animateHandlers.onTapStart,
          onTap: animateHandlers.onTap,
          onTapCancel: animateHandlers.onTapCancel
        })}
      >
        <svg
          className={clsx(css.shapeSvg)}
          viewBox={`0 0 ${w} ${h}`}>
          <g className={css.indicator}>
            <SelectedIndicator shape={element.shape} w={w} h={h} />
          </g>
          <ElementShapeSvg shape={element.shape} w={w} h={h} />
        </svg>
        <Box
          className={clsx(
            css.elementDataContainer,
            isTruthy(elementIcon) && css.hasIcon,
            'likec4-element'
          )}
        >
          {elementIcon}
          <Box className={clsx(css.elementTextData, 'likec4-element-main-props')}>
            <Text
              component={m.div}
              key={`${viewId}:element:title:${id}`}
              layoutId={`${viewId}:element:title:${id}`}
              className={clsx(css.title, 'likec4-element-title')}>
              {element.title}
            </Text>

            {element.technology && (
              <Text className={clsx(css.technology, 'likec4-element-technology')}>
                {element.technology}
              </Text>
            )}
            {element.description && (
              <Text className={clsx(css.description, 'likec4-element-description')} lineClamp={5}>
                {element.description}
              </Text>
            )}
          </Box>
        </Box>
        {/* {isHovercards && element.links && <ElementLink element={element} />} */}
        <BottomButtons
          keyPrefix={`${viewId}:element:${id}:`}
          onNavigateTo={isNavigable && onNavigateTo}
          onOpenRelationships={enableRelationshipBrowser && !!modelRef && onOpenRelationships}
          {...isInteractive && animateHandlers}
        />
        {enableElementDetails && !!modelRef && (
          <Box className={clsx(css.detailsBtnContainer)}>
            <ActionButton
              key='details'
              onClick={onOpenDetails}
              IconComponent={IconId}
              translate={{x: 0, y: 0}}
              tooltipLabel='Open details'
              {...isInteractive && animateHandlers}
              />
          </Box>
        )}
      </Box>
      <Handle type="target" position={Position.Top} className={css.handleCenter} />
      <Handle type="source" position={Position.Top} className={css.handleCenter} />
    </>
  )
}, isEqualProps)
