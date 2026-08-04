import { RichText } from '@likec4/core'
import type { ComputedStoryScene } from '@likec4/core/types'
import { css } from '@likec4/styles/css'
import { HStack, styled } from '@likec4/styles/jsx'
import {
  type ButtonProps,
  ActionIcon,
  Badge,
  Button,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  ScrollAreaAutosize,
} from '@mantine/core'
import {
  IconArrowFork,
  IconNotes,
  IconPlayerSkipBackFilled,
  IconPlayerSkipForwardFilled,
} from '@tabler/icons-react'
import { type HTMLMotionProps, AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { forwardRef } from 'react'
import { Markdown } from '../../base-primitives'
import { useMantinePortalProps } from '../../hooks'
import { useDiagram, useDiagramContext } from '../../hooks/useDiagram'
import { Tooltip } from '../_common'
import { currentScene, nextScene, prevScene } from './storyScenePosition'

/** Previous/Next button, styled like the dynamic-view walkthrough's own prev/next pair. */
export const StoryControlButton = forwardRef<HTMLButtonElement, ButtonProps & HTMLMotionProps<'button'>>((
  props,
  ref,
) => (
  <Button
    variant="light"
    size="xs"
    fw="500"
    {...props}
    ref={ref}
    component={m.button}
    whileTap={{
      scale: 0.95,
    }}
    layout="position"
  />
))
StoryControlButton.displayName = 'StoryControlButton'

const sceneTitleText = css({
  fontSize: 'xs',
  fontWeight: 'medium',
  color: 'text',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  minWidth: '0',
  maxWidth: '160px',
  userSelect: 'none',
})

/**
 * Story walkthrough controls: Previous/Next, the active scene's title and
 * notes, and the enclosing `alt` branch title as a badge when present.
 *
 * Previously wired to a dedicated story-cursor XState actor. That actor is
 * gone (see this task's brief and the plan's architecture note): once
 * Next/Prev became real route navigations, the actor's only reason to exist
 * — owning cursor state an XState machine could reach without React/router
 * access — evaporated. The route's `$viewId` param is now the cursor, and
 * `context.story` (supplied by the consumer alongside `view`, per
 * `LikeC4Diagram.props.ts`) plus `context.view.id` are enough to derive scene
 * position with a plain, pure lookup (`storyScenePosition.ts`). Next/Prev now
 * call `diagram.navigateTo`, the same `DiagramApi` method any other
 * navigation goes through — which emits the `navigateTo` event the consumer's
 * `onNavigateTo` (a real route push, per Task 7) already listens for.
 *
 * RFC 0001 chose depth-first `alt` traversal — `Next` walks every branch in
 * sequence rather than prompting the viewer to choose — so the branch badge
 * is the only signal telling a viewer they are inside a hypothetical rather
 * than a continuing timeline. It is not decorative.
 */
export function StoryControls() {
  const diagram = useDiagram()
  const portalProps = useMantinePortalProps()

  const { story, viewId } = useDiagramContext(s => ({ story: s.story, viewId: s.view.id }))

  const scene: ComputedStoryScene<any> | null = story ? currentScene(story, viewId) : null
  const prev = story ? prevScene(story, viewId) : null
  const next = story ? nextScene(story, viewId) : null

  return (
    <AnimatePresence propagate mode="popLayout">
      <StoryControlButton
        key="story-prev"
        disabled={!story}
        onClick={e => {
          e.stopPropagation()
          if (prev) {
            diagram.navigateTo(prev.view)
          }
        }}
        leftSection={<IconPlayerSkipBackFilled size={10} />}
      >
        Previous
      </StoryControlButton>

      {scene?.branchTitle && (
        <Tooltip key="story-branch-tooltip" label="Inside an alternative branch">
          <Badge
            component={m.div}
            layout="position"
            size="md"
            radius="sm"
            variant="light"
            color="orange"
            leftSection={<IconArrowFork size={11} />}
            className={css({ maxWidth: '220px' })}
            styles={{
              label: {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            }}
          >
            {scene.branchTitle}
          </Badge>
        </Tooltip>
      )}

      <HStack key="story-scene-narration" gap="xxs" css={{ minWidth: '0', flexShrink: 1 }}>
        <styled.span className={sceneTitleText} title={scene?.title ?? scene?.view ?? undefined}>
          {scene?.title ?? scene?.view ?? 'Story'}
        </styled.span>

        {scene?.notes && (
          <HoverCard position="bottom-start" openDelay={200} closeDelay={150} {...portalProps}>
            <HoverCardTarget>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={e => e.stopPropagation()}
                aria-label="Scene notes"
              >
                <IconNotes size={14} />
              </ActionIcon>
            </HoverCardTarget>
            <HoverCardDropdown maw={360}>
              <ScrollAreaAutosize mah={240} type="auto">
                <Markdown value={RichText.from(scene.notes)} fontSize="sm" />
              </ScrollAreaAutosize>
            </HoverCardDropdown>
          </HoverCard>
        )}
      </HStack>

      <StoryControlButton
        key="story-next"
        disabled={!story}
        onClick={e => {
          e.stopPropagation()
          if (next) {
            diagram.navigateTo(next.view)
          }
        }}
        rightSection={<IconPlayerSkipForwardFilled size={10} />}
      >
        Next
      </StoryControlButton>
    </AnimatePresence>
  )
}
StoryControls.displayName = 'StoryControls'
