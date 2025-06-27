import { isTagColorSpecified } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { type BoxProps, Box, HStack } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import { likec4tag } from '@likec4/styles/recipes'
import { useDebouncedState, useHover } from '@mantine/hooks'
import { NodeToolbar, Position } from '@xyflow/react'
import { deepEqual } from 'fast-equals'
import { forwardRef, memo, useCallback, useEffect } from 'react'
import { useTagSpecification } from '../../../context/TagStylesContext'
import { useDiagram } from '../../../hooks/useDiagram'
import { useCurrentZoom } from '../../../hooks/useXYFlow'
import { stopPropagation } from '../../../utils/xyflow'
import type { NodeProps } from '../../types'

export type ElementTagProps = {
  tag: string
} & Omit<BoxProps, 'children'>

export const ElementTag = forwardRef<HTMLDivElement, ElementTagProps>(
  ({ tag, className, ...props }, ref) => {
    const spec = useTagSpecification(tag)
    return (
      <Box
        ref={ref}
        data-likec4-tag={tag}
        className={cx(
          likec4tag({
            autoTextColor: isTagColorSpecified(spec),
          }),
          className,
        )}
        {...props}
      >
        <span style={{ opacity: 0.7, fontSize: '1.05em' }}>#</span>
        <span>{tag}</span>
      </Box>
    )
  },
)

type Data = {
  tags: readonly string[] | null | undefined
  width: number
}
type ElementTagsProps = NodeProps<Data>

const propsAreEqual = (prev: ElementTagsProps, next: ElementTagsProps) => {
  return (
    prev.data.width === next.data.width &&
    deepEqual(prev.data.tags, next.data.tags) &&
    (prev.data.hovered ?? false) === (next.data.hovered ?? false)
  )
}
export const ElementTags = memo(({ id, data: { tags, width, hovered = false } }: ElementTagsProps) => {
  const {
    hovered: isTagsBarHovered,
    ref: tagsBarRef,
  } = useHover()
  const {
    hovered: isTagsToolbarHovered,
    ref: tagsToolbarRef,
  } = useHover()

  const [isVisible, setVisible] = useDebouncedState(false, hovered ? 120 : 300)

  useEffect(() => {
    setVisible(visibleNow => {
      if (!visibleNow) {
        return hovered && (isTagsBarHovered || isTagsToolbarHovered)
      }
      return hovered || isTagsBarHovered || isTagsToolbarHovered
    })
  }, [isTagsBarHovered, isTagsToolbarHovered, hovered])

  const zoom = useCurrentZoom()
  const zoomIsLargeEnough = zoom > 1.2

  const diagram = useDiagram()

  const onHover = (tag: string) => {
    diagram.send({ type: 'tag.highlight', tag })
  }

  const onLeave = useCallback(() => {
    diagram.send({ type: 'tag.unhighlight' })
  }, [])

  if (!tags || tags.length === 0) {
    return null
  }
  const maxWidth = Math.max(Math.round(width * zoom) - 10, 200)

  return (
    <>
      <div
        ref={tagsBarRef}
        className={cx(
          'likec4-element-tags',
          hstack({
            pointerEvents: 'all',
            gap: 4,
            alignItems: 'flex-end',
            justifyItems: 'stretch',
            position: 'absolute',
            width: '100%',
            bottom: 0,
            left: 0,
            padding: 4,
            _shapeCylinder: {
              bottom: 5,
            },
            _shapeStorage: {
              bottom: 5,
            },
            _shapeQueue: {
              bottom: 0,
              paddingLeft: 14,
            },
          }),
        )}
        onClick={stopPropagation}
      >
        {tags.map((tag) => (
          <Box
            key={id + '#' + tag}
            data-likec4-tag={tag}
            className={css({
              layerStyle: 'likec4.tag',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: 50,
              height: 5,
              _whenHovered: {
                height: 12,
                borderRadius: 4,
                transitionDelay: '.08s',
              },
              transition: 'fast',
            })}
          />
        ))}
      </div>
      <NodeToolbar isVisible={isVisible} align="start" position={Position.Bottom}>
        <HStack
          ref={tagsToolbarRef}
          css={{
            gap: 4,
            flexWrap: 'wrap',
            pb: 'sm',
            translate: 'auto',
            x: -8,
            maxWidth,
          }}
        >
          {tags.map((tag) => (
            <ElementTag
              key={tag}
              tag={tag}
              className={css({
                userSelect: 'none',
                cursor: 'pointer',
                ...(zoomIsLargeEnough && {
                  fontSize: 'lg',
                  borderRadius: 4,
                  px: 6,
                }),
              })}
              onClick={e => {
                e.stopPropagation()
                diagram.openSearch(`#${tag}`)
              }}
              onMouseEnter={() => onHover(tag)}
              onMouseLeave={onLeave}
            />
          ))}
        </HStack>
      </NodeToolbar>
    </>
  )
}, propsAreEqual)
ElementTags.displayName = 'ElementTags'
