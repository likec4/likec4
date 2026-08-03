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
import { useSelector } from '@xstate/react'
import { type HTMLMotionProps, AnimatePresence } from 'motion/react'
import * as m from 'motion/react-m'
import { forwardRef } from 'react'
import { Markdown } from '../../base-primitives'
import { selectDiagramSnapshot, useDiagramSelector, useMantinePortalProps } from '../../hooks'
import type { StoryActorSnapshot } from '../../story/actor'
import { Tooltip } from '../_common'

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

const selectStoryActor = selectDiagramSnapshot(s => s.children.story ?? undefined)

/**
 * The scene the cursor is currently on, resolved from the story actor's own
 * `flow`/`cursor` — not from the parent diagram's `activeStoryCursor`, which
 * only advances once something dispatches `story.scene` (canvas rendering,
 * out of this component's scope).
 */
function selectActiveScene(snapshot: StoryActorSnapshot | undefined): ComputedStoryScene<any> | null {
  if (!snapshot?.context.cursor) {
    return null
  }
  return snapshot.context.flow.lookup(snapshot.context.cursor.scene) ?? null
}

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
 * Story walkthrough controls: Previous/Next wired to the story actor, the
 * active scene's title and notes, and the enclosing `alt` branch title as a
 * badge when present.
 *
 * RFC 0001 chose depth-first `alt` traversal — `Next` walks every branch in
 * sequence rather than prompting the viewer to choose — so the branch badge
 * is the only signal telling a viewer they are inside a hypothetical rather
 * than a continuing timeline. It is not decorative.
 */
export function StoryControls() {
  const storyActor = useDiagramSelector(selectStoryActor)
  const portalProps = useMantinePortalProps()

  // The story actor is spawned with the real, model-bound `resolve` from the
  // start (`DiagramActorProvider.tsx` feeds `useOptionalResolveSceneView()`
  // into the diagram machine's `context.resolve`, read by both of the
  // actor's spawn sites), so there is nothing to backfill here any more.
  // `update.resolve` (`story/actor.ts`) still exists as a fallback for
  // callers that spawn the actor directly without a model-bound resolver.
  const scene = useSelector(storyActor, selectActiveScene)

  return (
    <AnimatePresence propagate mode="popLayout">
      <StoryControlButton
        key="story-prev"
        disabled={!storyActor}
        onClick={e => {
          e.stopPropagation()
          storyActor?.send({ type: 'prev' })
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
        disabled={!storyActor}
        onClick={e => {
          e.stopPropagation()
          storyActor?.send({ type: 'next' })
        }}
        rightSection={<IconPlayerSkipForwardFilled size={10} />}
      >
        Next
      </StoryControlButton>
    </AnimatePresence>
  )
}
StoryControls.displayName = 'StoryControls'
