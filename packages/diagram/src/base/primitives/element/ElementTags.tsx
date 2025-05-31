import { type DiagramNode, isCustomTagColor } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { type BoxProps, Box, HStack } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import { likec4tag } from '@likec4/styles/recipes'
import { HoverCard } from '@mantine/core'
import { deepEqual } from 'fast-equals'
import { forwardRef, memo, useCallback } from 'react'
import { useTagSpecification } from '../../../context/TagStylesContext'
import { useDiagram } from '../../../hooks/useDiagram'
import { useMantinePortalProps } from '../../../hooks/useMantinePortalProps'
import { useCurrentZoom } from '../../../hooks/useXYFlow'
import { stopPropagation } from '../../../utils/xyflow'
import type { NodeProps } from '../../types'

export type ElementTagProps = {
  tag: string
} & Omit<BoxProps, 'children'>

export const ElementTag = forwardRef<HTMLDivElement, ElementTagProps>(
  ({ tag, className, ...props }, ref) => {
    const { color } = useTagSpecification(tag)
    return (
      <Box
        ref={ref}
        data-likec4-tag={tag}
        className={cx(
          likec4tag({
            autoTextColor: isCustomTagColor(color),
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

type Data = Pick<DiagramNode, 'tags' | 'width'>
type ElementTagsProps = NodeProps<Data>

const propsAreEqual = (prev: ElementTagsProps, next: ElementTagsProps) => {
  return prev.data.width === next.data.width && deepEqual(prev.data.tags, next.data.tags)
}
export const ElementTags = memo(({ data: { tags, width } }: ElementTagsProps) => {
  const zoom = useCurrentZoom()
  const zoomIsLargeEnough = zoom > 1.2
  const portalProps = useMantinePortalProps()
  if (!tags || tags.length === 0) {
    return null
  }
  const maxWidth = Math.max(Math.round(width * zoom) - 10, 200)

  return (
    <HoverCard
      {...portalProps}
      floatingStrategy="fixed"
      position="bottom-start"
      offset={{
        alignmentAxis: Math.round(4 * zoom),
        mainAxis: 8,
      }}
      keepMounted={false}
      openDelay={300}
      closeDelay={500}
    >
      <HoverCard.Target>
        <div
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
              key={tag}
              data-likec4-tag={tag}
              className={css({
                layerStyle: 'likec4.tag',
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: 50,
                minHeight: 5,
                _whenHovered: {
                  minHeight: 10,
                },
                transition: 'fast',
              })}
            />
          ))}
        </div>
      </HoverCard.Target>
      <HoverCard.Dropdown
        p={0}
        w={'auto'}
        maw={maxWidth}
        className={css({
          background: 'transparent',
          border: 'none',
        })}
      >
        <ElementTagsDropdown tags={tags} zoomIsLargeEnough={zoomIsLargeEnough} />
      </HoverCard.Dropdown>
    </HoverCard>
  )
}, propsAreEqual)
ElementTags.displayName = 'ElementTags'

function ElementTagsDropdown({ tags, zoomIsLargeEnough }: { tags: readonly string[]; zoomIsLargeEnough: boolean }) {
  const diagram = useDiagram()

  const onHover = (tag: string) => {
    diagram.send({ type: 'tag.highlight', tag })
  }

  const onLeave = useCallback(() => {
    diagram.send({ type: 'tag.unhighlight' })
  }, [])

  return (
    <HStack
      css={{
        gap: 4,
        flexWrap: 'wrap',
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
  )
}
