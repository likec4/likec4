import { type ThemeColor } from '@likec4/core'
import { ActionIcon, Box, Text as MantineText, Tooltip } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconId, IconZoomScan } from '@tabler/icons-react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual as eq } from 'fast-equals'
import { m, type Variants } from 'framer-motion'
import React, { memo, useCallback, useState } from 'react'
import { isNumber, isTruthy } from 'remeda'
import { useDiagramState } from '../../../hooks/useDiagramState'
import type { ElementXYFlowNode } from '../../types'
import { stopPropagation, toDomPrecision } from '../../utils'
import { ElementIcon } from '../shared/ElementIcon'
import { ElementToolbar } from '../shared/Toolbar'
import { useFramerAnimateVariants } from '../use-animate-variants'
import * as css from './element.css'
import { ElementShapeSvg, SelectedIndicator } from './ElementShapeSvg'

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

const VariantsNavigate = {
  idle: {
    '--ai-bg': 'var(--ai-bg-idle)',
    scale: 1,
    opacity: 0.5,
    translateX: '-50%',
    originY: 0.2
  },
  selected: {},
  hovered: {
    '--ai-bg': 'var(--ai-bg-hover)',
    translateX: '-50%',
    scale: 1.35,
    opacity: 1
  },
  'hovered:navigate': {
    scale: 1.42
  },
  'tap:navigate': {
    scale: 1.15
  }
} satisfies Variants
VariantsNavigate['selected'] = VariantsNavigate['hovered']

const VariantsDetailsBtn = {
  idle: {
    '--ai-bg': 'var(--ai-bg-idle)',
    scale: 1,
    opacity: 0.5
  },
  selected: {},
  hovered: {
    scale: 1.2,
    opacity: 0.7
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
  const {
    viewId,
    isEditable,
    isHovered,
    isDimmed,
    hasOnNavigateTo,
    isInteractive,
    enableElementDetails,
    triggerOnNavigateTo,
    openOverlay,
    renderIcon
  } = useDiagramState(s => ({
    viewId: s.view.id,
    isEditable: s.readonly !== true,
    isHovered: s.hoveredNodeId === id,
    isDimmed: s.dimmed.has(id),
    isInteractive: s.nodesDraggable || s.nodesSelectable || s.enableRelationshipsBrowser
      || (!!s.onNavigateTo && !!element.navigateTo),
    hasOnNavigateTo: !!s.onNavigateTo,
    enableElementDetails: s.enableElementDetails,
    triggerOnNavigateTo: s.triggerOnNavigateTo,
    openOverlay: s.openOverlay,
    renderIcon: s.renderIcon
  }))

  const isNavigable = hasOnNavigateTo && !!element.navigateTo
  // For development purposes, show the toolbar when the element is selected
  const isHoveredOrSelected = isHovered || (import.meta.env.DEV && selected)
  const _isToolbarVisible = isEditable && isHoveredOrSelected
  const [isToolbarVisible] = useDebouncedValue(_isToolbarVisible, _isToolbarVisible ? 500 : 300)

  const w = toDomPrecision(width ?? element.width)
  const h = toDomPrecision(height ?? element.height)

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

  // const onTap = useCallback((e: MouseEvent) => {
  //   if (_isDetailsVisible) {
  //     //detailsOps.toggle()
  //     // openOverlay({
  //     //   elementDetails: element.id
  //     // })
  //   }
  //   // Open details on tap
  //   animateHandlers.onTap(e)
  // }, [animateHandlers.onTap, _isDetailsVisible, detailsOps.toggle])

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
        key={`${viewId}:element:${id}`}
        layoutId={`${viewId}:element:${id}`}
        className={css.containerForFramer}
        // initial={{
        //   opacity: 0,
        //   scale: 0.8
        // }}
        // animate={{
        //   opacity: 1,
        //   scale: 1,
        //   transition: {
        //     delay: 0.3
        //   }
        // }}
      >
        <Box
          component={m.div}
          className={clsx([
            css.container,
            isDimmed && css.dimmed,
            animate !== 'idle' && css.containerAnimated,
            'likec4-element-node'
          ])}
          data-hovered={!dragging && isHovered}
          data-likec4-color={previewColor ?? element.color}
          data-likec4-shape={element.shape}
          data-animate-target=""
          initial={false}
          variants={VariantsRoot}
          animate={(isHovered && !dragging) ? (animateVariants ?? animate) : animate}
          tabIndex={-1}
          {...(isInteractive && {
            onTapStart: animateHandlers.onTapStart,
            onTap: animateHandlers.onTap,
            onTapCancel: animateHandlers.onTapCancel
          })}
        >
          <svg
            className={clsx(css.shapeSvg)}
            viewBox={`0 0 ${w} ${h}`}
            width={w}
            height={h}>
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
          {isNavigable && (
            <ActionIcon
              component={m.div}
              variants={VariantsNavigate}
              data-animate-target="navigate"
              className={clsx('nodrag nopan', css.navigateBtn)}
              radius="md"
              style={{ zIndex: 100 }}
              role="button"
              onClick={onNavigateTo}
              onDoubleClick={stopPropagation}
              {...isInteractive && animateHandlers}
            >
              <IconZoomScan style={{ width: '75%' }} />
            </ActionIcon>
          )}
          {enableElementDetails && (
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
                <IconId style={{ width: '75%' }} />
              </ActionIcon>
            </Tooltip>
          )}
        </Box>
      </Box>
      <Handle type="target" position={Position.Top} className={css.handleCenter} />
      <Handle type="source" position={Position.Top} className={css.handleCenter} />
    </>
  )
}, isEqualProps)

// const ElementIcon = (
//   { element, viewId, renderIcon: RenderIcon }: {
//     element: DiagramNode
//     viewId: string
//     renderIcon: ElementIconRenderer | null
//   }
// ) => {
//   if (!element.icon) {
//     return null
//   }
//   let icon = null as React.ReactNode
//   if (element.icon.startsWith('http://') || element.icon.startsWith('https://')) {
//     icon = <img src={element.icon} alt={element.title} />
//   } else if (RenderIcon) {
//     icon = <RenderIcon node={element} />
//   }

//   if (!icon) {
//     return null
//   }
//   return (
//     <m.div
//       // key={`${viewId}:element:icon:${element.id}`}
//       layoutId={`${viewId}:element:icon:${element.id}`}
//       className={clsx(
//         css.elementIcon,
//         'likec4-element-icon'
//       )}
//       data-likec4-icon={element.icon}
//     >
//       {icon}
//     </m.div>
//   )
// }
