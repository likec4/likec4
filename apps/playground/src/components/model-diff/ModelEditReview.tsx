import { usePlayground, usePlaygroundContext } from '$/hooks/usePlayground'
import { type LineChange, collapseUnchanged, diffLines } from '@likec4/core/utils'
import type { DocumentChange } from '@likec4/language-server/protocol'
import { Alert, Box, Button, Checkbox, Group, Loader, Modal, ScrollArea, Stack, Text } from '@mantine/core'
import { useMemo, useState } from 'react'

const ContextLines = 3

function fileNameOf(uri: string): string {
  return decodeURIComponent(new URL(uri).pathname).replace(/^\//, '')
}

const lineStyles: Record<LineChange['type'], { prefix: string; background?: string; color?: string }> = {
  same: { prefix: ' ' },
  added: {
    prefix: '+',
    background: 'var(--mantine-color-teal-light)',
    color: 'var(--mantine-color-teal-light-color)',
  },
  removed: {
    prefix: '−',
    background: 'var(--mantine-color-red-light)',
    color: 'var(--mantine-color-red-light-color)',
  },
  skipped: { prefix: ' ', color: 'var(--mantine-color-dimmed)' },
}

function FileChanges({ change }: { change: DocumentChange }) {
  const lines = useMemo(
    () => collapseUnchanged(diffLines(change.before, change.after), ContextLines),
    [change],
  )
  const added = lines.filter(l => l.type === 'added').length
  const removed = lines.filter(l => l.type === 'removed').length
  return (
    <Stack gap={4}>
      <Group justify="space-between">
        <Text size="sm" fw={600}>{fileNameOf(change.uri)}</Text>
        <Text size="xs">
          <Text span c="teal">+{added}</Text> <Text span c="red">−{removed}</Text>
        </Text>
      </Group>
      <Box
        ff="monospace"
        fz="xs"
        style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 4, overflowX: 'auto' }}>
        {lines.map((line, index) => {
          const style = lineStyles[line.type]
          return (
            <Box
              key={index}
              px={6}
              style={{ whiteSpace: 'pre', background: style.background, color: style.color }}>
              {line.type === 'skipped' ? `  ··· ${line.count} unchanged line(s)` : `${style.prefix} ${line.line}`}
            </Box>
          )
        })}
      </Box>
    </Stack>
  )
}

/**
 * Changes of the model edit (apply or discard a diff, safe delete) for review before they are applied.
 */
export function ModelEditReview() {
  const playground = usePlayground()
  const current = usePlaygroundContext(c => c.editReview)
  // Keeps the content while the modal closes
  const [shown, setShown] = useState(current)
  if (current && current !== shown) {
    setShown(current)
  }
  const review = current ?? shown
  const close = () => playground.send({ type: 'edit.cancel' })
  const preview = review?.preview
  // Token of the preview whose overlaps the approver accepted
  const [acceptedToken, setAcceptedToken] = useState<string | null>(null)
  const hasOverlaps = !!preview && preview.overlaps.length > 0
  const overlapsAccepted = hasOverlaps && acceptedToken === preview.token

  return (
    <Modal
      opened={current !== null}
      onClose={close}
      size="xl"
      title={<Text fw={600}>{preview?.label ?? 'Review changes'}</Text>}
      scrollAreaComponent={ScrollArea.Autosize}>
      {review && (
        <Stack gap="md">
          {review.state === 'loading' && <Loader size="sm" />}
          {preview && (
            <>
              <Text size="sm" c="dimmed">
                {preview.documents.length > 0
                  ? `These files will change. Approve to apply the changes, you can roll them back after.`
                  : 'Nothing will change.'}
              </Text>
              {hasOverlaps && (
                <Alert color="yellow" p="xs" title="This diff overlaps with other diffs">
                  <Stack gap={4}>
                    {preview.overlaps.map(overlap => <Text key={overlap} size="xs">{overlap}</Text>)}
                    <Checkbox
                      size="xs"
                      mt={4}
                      checked={overlapsAccepted}
                      onChange={event => setAcceptedToken(event.currentTarget.checked ? preview.token : null)}
                      label="The owners of these diffs agreed on this change"
                    />
                  </Stack>
                </Alert>
              )}
              {preview.documents.map(change => <FileChanges key={change.uri} change={change} />)}
            </>
          )}
          {review.error && (
            <Alert color="red" p="xs">
              <Stack gap="xs">
                <Text size="sm">{review.error}</Text>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  w="fit-content"
                  onClick={() => playground.send({ type: 'edit.review', request: review.request })}>
                  Review again
                </Button>
              </Stack>
            </Alert>
          )}
          <Group justify="flex-end" gap="xs">
            <Button size="xs" variant="default" onClick={close}>Cancel</Button>
            <Button
              size="xs"
              color="teal"
              disabled={review.state !== 'review' || !preview || preview.documents.length === 0
                || (hasOverlaps && !overlapsAccepted)}
              loading={review.state === 'applying'}
              onClick={() => playground.send({ type: 'edit.approve', acceptOverlaps: overlapsAccepted })}>
              Approve and apply
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}
