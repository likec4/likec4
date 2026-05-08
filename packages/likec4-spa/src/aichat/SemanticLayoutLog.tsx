import { Txt } from '@likec4/styles/jsx'
import { Modal, Title } from '@mantine/core'
import { closeSemanticLayoutLog, useSemanticLayoutLog } from './semantic-layout-log-state'

/**
 * Modal that shows the log of the semantic layout application
 * (For internal debugging purposes)
 */
export function SemanticLayoutLog() {
  const { log, status } = useSemanticLayoutLog()
  if (status === 'closed') {
    return null
  }
  const closable = status === 'completed'
  return (
    <Modal
      size={'xl'}
      opened
      onClose={closeSemanticLayoutLog}
      closeOnEscape={closable}
      withCloseButton={closable}
      closeOnClickOutside={closable}
      title={<Title order={4}>Semantic Layout</Title>}
    >
      <Txt whiteSpace={'pre-wrap'}>{log || 'Waiting for response...'}</Txt>
    </Modal>
  )
}
