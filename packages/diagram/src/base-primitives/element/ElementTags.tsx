import { type NonEmptyReadonlyArray, isTagColorSpecified } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { Box, HStack } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import { likec4tag } from '@likec4/styles/recipes'
import { useDebouncedState, useHover } from '@mantine/hooks'
import { NodeToolbar, Position, useStore } from '@xyflow/react'
import { deepEqual } from 'fast-equals'
import { type ComponentPropsWithoutRef, forwardRef, memo, useCallback, useEffect } from 'react'
import { hasAtLeast } from 'remeda'
import type { BaseNodePropsWithData } from '../../base/types'
import { useTagSpecification } from '../../context/TagStylesContext'
import { useCurrentZoomAtLeast } from '../../hooks/useXYFlow'
import { stopPropagation } from '../../utils/xyflow'

export type ElementTagProps = {
  tag: string
  cursor?: 'pointer' | 'default'
} & Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'color'>

export const ElementTag = forwardRef<HTMLDivElement, ElementTagProps>(
  ({ tag, cursor, className, style, ...props }, ref) => {
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
        style={{
          cursor,
          ...style,
        }}
      >
        <span>#</span>
        <span>{tag}</span>
      </Box>
    )
  },
)

type Data = {
  tags: readonly string[] | null | undefined
  width: number
}
export type ElementTagsProps = BaseNodePropsWithData<Data> & {
  onTagClick?: (tag: `#${string}`) => void
  onTagMouseEnter?: (tag: `#${string}`) => void
  onTagMouseLeave?: (tag: `#${string}`) => void
}

const propsAreEqual = (prev: ElementTagsProps, next: ElementTagsProps) => {
  return (
    prev.id === next.id &&
    prev.data.width === next.data.width &&
    (prev.data.hovered ?? false) === (next.data.hovered ?? false) &&
    deepEqual(prev.data.tags, next.data.tags)
  )
}
export const ElementTags = memo(
  ({ id, data: { tags, width, hovered = false }, onTagClick, onTagMouseEnter, onTagMouseLeave }: ElementTagsProps) => {
    if (!tags || !hasAtLeast(tags, 1)) {
      return null
    }

    return (
      <WithElementTags
        id={id}
        tags={tags}
        width={width}
        hovered={hovered}
        onTagClick={onTagClick}
        onTagMouseEnter={onTagMouseEnter}
        onTagMouseLeave={onTagMouseLeave}
      />
    )
  },
  propsAreEqual,
)
ElementTags.displayName = 'ElementTags'

function WithElementTags({
  id,
  tags,
  width,
  hovered,
  onTagClick,
  onTagMouseEnter,
  onTagMouseLeave,
}: {
  id: string
  tags: NonEmptyReadonlyArray<string>
  width: number
  hovered: boolean
  onTagClick?: ((tag: `#${string}`) => void) | undefined
  onTagMouseEnter?: ((tag: `#${string}`) => void) | undefined
  onTagMouseLeave?: ((tag: `#${string}`) => void) | undefined
}) {
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

  const zoomIsLargeEnough = useCurrentZoomAtLeast(1.2)

  const maxWidth = useStore(
    useCallback(
      state => Math.max(Math.round(width * state.transform[2]) - 10, 200),
      [Math.round(width)],
    ),
  )

  return (
    <>
      <div
        ref={tagsBarRef}
        className={cx(
          'likec4-element-tags',
          hstack({
            pointerEvents: 'all',
            gap: '1',
            alignItems: 'flex-end',
            justifyItems: 'stretch',
            position: 'absolute',
            width: '100%',
            bottom: '0',
            left: '0',
            padding: '1',
            _shapeCylinder: {
              bottom: '[5px]',
            },
            _shapeStorage: {
              bottom: '[5px]',
            },
            _shapeQueue: {
              bottom: '0',
              paddingLeft: '[14px]',
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
              flex: '1',
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
            gap: '0.5',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            pb: 'sm',
            translate: 'auto',
            x: '[-8px]',
          }}
          style={{
            maxWidth,
          }}
        >
          {tags.map((tag) => (
            <ElementTag
              key={tag}
              tag={tag}
              cursor="pointer"
              className={css({
                userSelect: 'none',
                ...(zoomIsLargeEnough && {
                  fontSize: 'lg',
                  borderRadius: '[4px]',
                  px: '1.5', // 6px
                }),
              })}
              onClick={onTagClick
                ? ((e) => {
                  e.stopPropagation()
                  onTagClick(`#${tag}`)
                })
                : undefined}
              onMouseEnter={onTagMouseEnter
                ? () => onTagMouseEnter(`#${tag}`)
                : undefined}
              onMouseLeave={onTagMouseLeave
                ? () => onTagMouseLeave(`#${tag}`)
                : undefined}
            />
          ))}
        </HStack>
      </NodeToolbar>
    </>
  )
}
