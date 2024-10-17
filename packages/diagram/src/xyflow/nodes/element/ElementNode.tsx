import { type DiagramNode, type ThemeColor } from '@likec4/core'
import { ActionIcon, Text as MantineText, Tooltip } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconTransform, IconZoomScan } from '@tabler/icons-react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual as eq } from 'fast-equals'
import { m, type Variants } from 'framer-motion'
import { memo, useCallback, useState } from 'react'
import { isNumber, isTruthy } from 'remeda'
import { useDiagramState } from '../../../hooks/useDiagramState'
import type { ElementIconRenderer } from '../../../LikeC4Diagram.props'
import type { ElementXYFlowNode } from '../../types'
import { stopPropagation, toDomPrecision } from '../../utils'
import { ElementToolbar } from '../shared/Toolbar'
import { useFramerAnimateVariants } from '../use-animate-variants'
import * as css from './element.css'
import { ElementLink } from './ElementLink'
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
        delayChildren: 0.06,
        staggerChildren: 0.07,
        staggerDirection: -1
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
        delayChildren: 0.07,
        staggerChildren: 0.1
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
    opacity: 0.75,
    translateX: '-50%',
    originY: 0.1
  },
  selected: {},
  hovered: {
    display: 'block',
    '--ai-bg': 'var(--ai-bg-hover)',
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

/**
 * Variants for the relationships button (when Navigate button is visible)
 */
const VariantsRelationsBtn = {
  idle: {
    '--ai-bg': 'var(--ai-bg-idle)',
    scale: 1,
    opacity: 0,
    originX: 0.25,
    originY: 0.1,
    translateX: -8,
    transitionEnd: {
      display: 'none'
    }
  },
  selected: {},
  hovered: {
    display: 'block',
    '--ai-bg': 'var(--ai-bg-hover)',
    scale: 1.25,
    opacity: 1,
    translateX: 0
  },
  'hovered:navigate': {},
  'hovered:relations': {
    scale: 1.42
  },
  'tap:relations': {
    scale: 1.15
  }
} satisfies Variants
VariantsRelationsBtn['selected'] = VariantsRelationsBtn['hovered']

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
    isEditable,
    isHovered,
    isDimmed,
    hasOnNavigateTo,
    isHovercards,
    isInteractive,
    enableRelationshipsMode,
    triggerOnNavigateTo,
    openOverlay,
    renderIcon
  } = useDiagramState(s => ({
    isEditable: s.readonly !== true,
    isHovered: s.hoveredNodeId === id,
    isDimmed: s.dimmed.has(id),
    isInteractive: s.nodesDraggable || s.nodesSelectable || s.enableRelationshipsBrowser
      || (!!s.onNavigateTo && !!element.navigateTo),
    isHovercards: s.showElementLinks,
    hasOnNavigateTo: !!s.onNavigateTo,
    enableRelationshipsMode: s.enableRelationshipsBrowser,
    triggerOnNavigateTo: s.triggerOnNavigateTo,
    openOverlay: s.openOverlay,
    renderIcon: s.renderIcon
  }))

  const isNavigable = hasOnNavigateTo && !!element.navigateTo

  const _isToolbarVisible = isEditable && (isHovered || (import.meta.env.DEV && selected))
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
    renderIcon
  })

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
        <ElementToolbar
          element={element}
          isVisible={isToolbarVisible}
          onColorPreview={setPreviewColor}
        />
      )}
      <m.div
        id={id}
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
        variants={VariantsRoot}
        initial={false}
        animate={(isHovered && !dragging) ? (animateVariants ?? animate) : animate}
        tabIndex={-1}
        {...(isInteractive && {
          onTapStart: animateHandlers.onTapStart,
          onTap: animateHandlers.onTap,
          onTapCancel: animateHandlers.onTapCancel
        })}
      >
        <svg className={clsx(css.cssShapeSvg)} viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
          <g className={css.indicator}>
            <SelectedIndicator shape={element.shape} w={w} h={h} />
          </g>
          <ElementShapeSvg shape={element.shape} w={w} h={h} />
        </svg>
        <div
          className={clsx(
            css.elementDataContainer,
            isTruthy(elementIcon) && css.hasIcon,
            'likec4-element'
          )}
        >
          {elementIcon}
          <div className={clsx(css.elementTextData, 'likec4-element-main-props')}>
            <Text className={clsx(css.title, 'likec4-element-title')} lineClamp={3}>
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
          </div>
        </div>
        {isHovercards && element.links && <ElementLink element={element} />}
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
            <IconZoomScan stroke={1.8} style={{ width: '75%' }} />
          </ActionIcon>
        )}
        {enableRelationshipsMode && (
          <Tooltip fz="xs" color="dark" label="Browse relationships" withinPortal={false} openDelay={600}>
            <ActionIcon
              component={m.div}
              // Is is a second button, so we need to use a different variant
              variants={isNavigable ? VariantsRelationsBtn : VariantsRelationsBtnSingle}
              data-animate-target={isNavigable ? 'relations' : 'navigate'}
              className={clsx('nodrag nopan', css.navigateBtn)}
              radius="md"
              style={{
                left: isNavigable ? 'calc(50% + 28px)' : '50%',
                zIndex: 99
              }}
              role="button"
              onClick={onBrowseRelations}
              onDoubleClick={stopPropagation}
              {...isInteractive && animateHandlers}
            >
              <IconTransform stroke={1.8} style={{ width: '67%' }} />
            </ActionIcon>
          </Tooltip>
        )}
      </m.div>
      <Handle type="target" position={Position.Top} className={css.handleCenter} />
      <Handle type="source" position={Position.Top} className={css.handleCenter} />
    </>
  )
}, isEqualProps)

const ElementIcon = (
  { element, renderIcon: RenderIcon }: { element: DiagramNode; renderIcon: ElementIconRenderer | null }
) => {
  if (!element.icon) {
    return null
  }
  if (element.icon.startsWith('http://') || element.icon.startsWith('https://')) {
    return (
      <div className={clsx(css.elementIcon, 'likec4-element-icon')}>
        <img src={element.icon} alt={element.title} />
      </div>
    )
  }
  const icon = RenderIcon ? <RenderIcon node={element} /> : null
  if (!icon) {
    return null
  }
  return (
    <div
      className={clsx(
        css.elementIcon,
        'likec4-element-icon'
      )}
      data-likec4-icon={element.icon}
    >
      {icon}
    </div>
  )
}
