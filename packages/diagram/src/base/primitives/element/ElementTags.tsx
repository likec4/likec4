import { type DiagramNode } from '@likec4/core'
import { css, cx } from '@likec4/styles/css'
import { type BoxProps, Box, HStack } from '@likec4/styles/jsx'
import { hstack, likec4tag } from '@likec4/styles/patterns'
import { HoverCard } from '@mantine/core'
import { deepEqual } from 'fast-equals'
import { forwardRef, memo, useCallback } from 'react'
import { useTagStyles } from '../../../context/TagStylesContext'
import { useDiagram } from '../../../hooks/useDiagram'
import { useMantinePortalProps } from '../../../hooks/useMantinePortalProps'
import { useCurrentZoom } from '../../../hooks/useXYFlow'
import { stopPropagation } from '../../../utils/xyflow'
import type { NodeProps } from '../../types'

export type ElementTagProps = {
  tag: string
  tagColor: string
} & Omit<BoxProps, 'children' | 'css'>

export const ElementTag = forwardRef<HTMLDivElement, ElementTagProps>(
  ({ tag, tagColor, className, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={cx(
          likec4tag({
            tagColor: tagColor as any,
          }),
          className,
          css({
            transition: 'fast',
            fontSize: 'xs',
            fontWeight: 500,
            '& > span': {
              display: 'inline-block',
            },
            width: 'min-content',
            minWidth: 30,
            whiteSpace: 'nowrap',
            backgroundColor: 'likec4.tag.bg/80',
            px: 5,
          }),
        )}
        {...props}
      >
        <span style={{ opacity: 0.5, marginRight: 1, fontSize: '1.05em' }}>#</span>
        <span>{tag}</span>
      </Box>
    )
  },
)
// const selectCurrentZoom = (state: ReactFlowState) => state.transform[2] > 1.2
// function useCurrentZoomIsLargeEnough(): boolean {
//   return useStore(selectCurrentZoom)
// }
function ElementTagsDropdown({ tags, zoomIsLargeEnough }: { tags: readonly string[]; zoomIsLargeEnough: boolean }) {
  const { getTagColor } = useTagStyles()
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
        gap: 6,
        flexWrap: 'wrap',
      }}
    >
      {tags.map((tag) => (
        <ElementTag
          key={tag}
          tag={tag}
          tagColor={getTagColor(tag)}
          className={css({
            cursor: 'pointer',
            ...(zoomIsLargeEnough && {
              fontSize: 'lg',
              borderRadius: 4,
              px: 8,
            }),
          })}
          onMouseEnter={() => onHover(tag)}
          onMouseLeave={onLeave}
        />
      ))}
    </HStack>
  )
}

type Data = Pick<DiagramNode, 'tags' | 'width'>
type ElementTagsProps = NodeProps<Data>

const propsAreEqual = (prev: ElementTagsProps, next: ElementTagsProps) => {
  return prev.data.width === next.data.width && deepEqual(prev.data.tags, next.data.tags)
}
export const ElementTags = memo(({ data: { tags, width } }: ElementTagsProps) => {
  const zoom = useCurrentZoom()
  const zoomIsLargeEnough = zoom > 1.2
  const { getTagColor } = useTagStyles()
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
        alignmentAxis: 0,
        mainAxis: 4,
      }}
      keepMounted={false}
      openDelay={500}
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
              paddingBottom: 4,
              paddingLeft: 4,
              paddingTop: 'sm',
              paddingRight: 4,
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
              className={css({
                flex: 1,
                pointerEvents: 'all',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                maxWidth: 50,
                minHeight: 8,
                color: 'likec4.tag.text',
                backgroundColor: 'likec4.tag.bg',
                _hover: {
                  backgroundColor: 'likec4.tag.bg.hover',
                },
                border: 'none',
                // borderColor: 'likec4.tag.border',
                transition: 'fast',
                borderRadius: 3,
                tagColor: getTagColor(tag),
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
