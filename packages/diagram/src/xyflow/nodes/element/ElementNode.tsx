import { defaultTheme, type DiagramNode, type ThemeColor } from '@likec4/core'
import { Text as MantineText } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { deepEqual as eq } from 'fast-equals'
import { m, type Variants } from 'framer-motion'
import { memo, useState } from 'react'
import { isNumber, isTruthy, keys } from 'remeda'
import { type DiagramStoreApi, useDiagramState, useDiagramStoreApi } from '../../../hooks/useDiagramState'
import type { ElementXYFlowNode } from '../../types'
import { toDomPrecision } from '../../utils'
import { NavigateToBtn } from '../shared/NavigateToBtn'
import { ElementToolbar } from '../shared/Toolbar'
import * as css from './element.css'
import { ElementLink } from './ElementLink'
import { ElementShapeSvg, SelectedIndicator } from './ElementShapeSvg'

const {
  primary,
  secondary,
  muted,
  ...otherColors
} = defaultTheme.elements

export const themedColors = [
  { key: 'primary', value: primary.fill },
  { key: 'secondary', value: secondary.fill },
  { key: 'muted', value: muted.fill }
] satisfies Array<{ key: ThemeColor; value: string }>

export const colors = keys(otherColors).map(key => ({
  key,
  value: defaultTheme.elements[key].fill
}))

export type ThemeColorKey = typeof themedColors[0]['key']
export type ColorKey = typeof colors[0]['key']

const Text = MantineText.withProps({
  component: 'div'
})

type ElementNodeProps = NodeProps<ElementXYFlowNode>

const selectedScale = 1.015
// Frame-motion variants
const variants = {
  idle: (_, { scale }) => ({
    scale: 1,
    transition: {
      delay: isNumber(scale) && scale > selectedScale ? 0.09 : 0
    }
  }),
  selected: (_, { scale }) => ({
    scale: selectedScale,
    transition: {
      delay: isNumber(scale) && scale > selectedScale ? 0.09 : 0
    }
  }),
  // dimmed: {
  //   filter: 'brightness(0.5)',
  //   transition: {
  //     duration: 0.8,
  //     ease: 'easeInOut',
  //   }
  // },
  // dragging: {
  //   scale: selectedScale
  // },
  // hovered: {
  //   scale: 1.08
  // },
  // hover: (_, {scale}) => isNumber(scale) && scale < 1.02 ? ({
  //   scale: 1.08,
  // }) : ({
  //   scale: 1.08,
  //   transition: {
  //     delay: 1
  //   }
  // }),
  hovered: {
    scale: 1.06
  },
  tap: {
    scale: 0.975
  }
  // tap: {
  //   scale: 0.9
  // }
} satisfies Variants

const isEqualProps = (prev: ElementNodeProps, next: ElementNodeProps) => (
  prev.id === next.id
  && eq(prev.selected ?? false, next.selected ?? false)
  && eq(prev.dragging ?? false, next.dragging ?? false)
  // && eq(prev.draggable ?? false, next.draggable ?? false)
  && eq(prev.width ?? 0, next.width ?? 0)
  && eq(prev.height ?? 0, next.height ?? 0)
  && eq(prev.data.element, next.data.element)
)

export const ElementNodeMemo = memo<ElementNodeProps>(function ElementNode({
  id,
  data: {
    element
  },
  dragging,
  // draggable = false,
  selected = false,
  width,
  height
}) {
  const store = useDiagramStoreApi()
  const { isEditable, isHovered, isDimmed, hasOnNavigateTo, isHovercards, isInteractive } = useDiagramState(s => ({
    isEditable: s.readonly !== true,
    isHovered: s.hoveredNodeId === id,
    isDimmed: s.dimmed.has(id),
    isInteractive: s.nodesDraggable || s.nodesSelectable || (!!s.onNavigateTo && !!element.navigateTo),
    isHovercards: s.showElementLinks,
    hasOnNavigateTo: !!s.onNavigateTo
    // hasGoToSource: !!s.onOpenSourceElement
  }))
  const isNavigable = hasOnNavigateTo && !!element.navigateTo
  // const isIdle = useIdle(300)
  // const [isToolbarVisible] = useDebouncedValue(isEditable && (isHovered || (import.meta.env.DEV && selected)), isIdle ? 50 : 350)
  const _isToolbarVisible = isEditable && (isHovered || (import.meta.env.DEV && selected))

  const [isToolbarVisible] = useDebouncedValue(_isToolbarVisible, _isToolbarVisible ? 500 : 300)

  const w = toDomPrecision(width ?? element.width)
  const h = toDomPrecision(height ?? element.height)

  let animate: keyof typeof variants = 'idle'
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
  }

  const elementIcon = ElementIcon({ node: element, store })

  const [previewColor, setPreviewColor] = useState<ThemeColor | null>(null)

  return (
    <>
      {isToolbarVisible && (
        <ElementToolbar
          element={element}
          isVisible={isToolbarVisible}
          onColorPreview={setPreviewColor}
        />
      )}
      <Handle
        type="target"
        position={Position.Top}
        className={css.handleCenter}
      />
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
        variants={variants}
        initial={false}
        animate={animate}
        tabIndex={-1}
        {...(isInteractive && {
          whileTap: dragging ? animate : 'tap'
        })}
      >
        {
          /* <svg
          className={clsx(
            css.cssShapeSvgMultiple
          )}
          viewBox={`0 0 ${w} ${h}`}
          width={w}
          height={h}
        >
          <ElementShapeSvg
            shape={element.shape}
            w={w}
            h={h}
          />
        </svg> */
        }
        <svg
          className={clsx(
            css.cssShapeSvg
          )}
          viewBox={`0 0 ${w} ${h}`}
          width={w}
          height={h}
        >
          <g className={css.indicator}>
            <SelectedIndicator
              shape={element.shape}
              w={w}
              h={h}
            />
          </g>
          <ElementShapeSvg
            shape={element.shape}
            w={w}
            h={h}
          />
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
            <Text
              className={clsx(css.title, 'likec4-element-title')}>
              {element.title}
            </Text>
            {element.technology && (
              <Text
                className={clsx(css.technology, 'likec4-element-technology')}>
                {element.technology}
              </Text>
            )}
            {element.description && (
              <Text
                className={clsx(css.description, 'likec4-element-description')}>
                {element.description}
              </Text>
            )}
          </div>
        </div>
        {isHovercards && element.links && <ElementLink element={element} />}
        {isNavigable && <NavigateToBtn xynodeId={id} className={css.cssNavigateBtn} />}
      </m.div>
      <Handle
        type="source"
        position={Position.Top}
        className={css.handleCenter}
      />
    </>
  )
}, isEqualProps)

const ElementIcon = ({ node, store }: { node: DiagramNode; store: DiagramStoreApi }) => {
  if (!node.icon) {
    return null
  }
  if (node.icon.startsWith('http://') || node.icon.startsWith('https://')) {
    return (
      <div className={clsx(css.elementIcon, 'likec4-element-icon')}>
        <img src={node.icon} alt={node.title} />
      </div>
    )
  }
  const RenderIcon = store.getState().renderIcon
  const icon = RenderIcon ? <RenderIcon node={node} /> : null
  if (!icon) {
    return null
  }
  return (
    <div className={clsx(css.elementIcon, 'likec4-element-icon')}>
      {icon}
    </div>
  )
}
