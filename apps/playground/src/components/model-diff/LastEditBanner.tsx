import { usePlayground, usePlaygroundContext } from '$/hooks/usePlayground'
import { ActionIcon, Alert, Anchor, Button, Group, Stack, Text } from '@mantine/core'
import { IconAlertTriangle, IconArrowBackUp, IconCheck, IconX } from '@tabler/icons-react'

/**
 * Result of the latest applied edit, with roll back.
 */
export function LastEditBanner() {
  const playground = usePlayground()
  const lastEdit = usePlaygroundContext(c => c.lastEdit)
  if (!lastEdit) {
    return null
  }
  const { edit, remaining, state, error } = lastEdit
  const isRolledBack = state === 'rolled-back'
  const hasErrors = !isRolledBack && remaining.length > 0

  return (
    <Alert
      p="xs"
      mb="xs"
      color={hasErrors || error ? 'yellow' : 'teal'}
      icon={hasErrors || error ? <IconAlertTriangle size={16} /> : <IconCheck size={16} />}>
      <Stack gap={4}>
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Text size="xs" fw={500}>
            {isRolledBack ? `Rolled back: ${edit.label}` : `Applied: ${edit.label}`}
          </Text>
          <ActionIcon
            size="xs"
            variant="subtle"
            color="gray"
            aria-label="Dismiss"
            onClick={() => playground.send({ type: 'edit.dismiss' })}>
            <IconX size={12} />
          </ActionIcon>
        </Group>
        {!isRolledBack && (
          <Text size="xs" c="dimmed">
            {remaining.length === 0
              ? 'The edit left no errors.'
              : `${remaining.length} error(s) are left to fix manually:`}
          </Text>
        )}
        {hasErrors && remaining.map((remainingError, index) => (
          <Anchor
            key={index}
            size="xs"
            component="button"
            ta="left"
            onClick={() =>
              playground.send({
                type: 'workspace.revealLocation',
                location: { uri: remainingError.uri, range: remainingError.range },
              })}>
            {remainingError.diffId ? `Diff ${remainingError.diffId}: ` : ''}
            {remainingError.message}
          </Anchor>
        ))}
        {error && <Text size="xs" c="red">{error}</Text>}
        {!isRolledBack && (
          <Button
            size="compact-xs"
            variant="light"
            color="gray"
            w="fit-content"
            leftSection={<IconArrowBackUp size={12} />}
            loading={state === 'rolling-back'}
            onClick={() => playground.send({ type: 'edit.rollback' })}>
            Roll back
          </Button>
        )}
      </Stack>
    </Alert>
  )
}
