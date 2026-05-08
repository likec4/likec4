import { HStack } from '@likec4/styles/jsx'
import { ActionIcon, Button, Textarea } from '@mantine/core'
import { IconPlayerStopFilled } from '@tabler/icons-react'
import { useRef, useState } from 'react'
import { useChatContext } from './ChatContext'

export function ChatInput() {
  const { sendMessage, isLoading, messages, clear, stop } = useChatContext()
  const [value, setValue] = useState('')
  const inputRef = useRef(null)
  const handleSubmit = () => {
    if (!value.trim() || isLoading) return
    sendMessage(value)
    setValue('')
  }
  return (
    <HStack>
      <Textarea
        flex={1}
        className="chat-input"
        placeholder="Your question..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            handleSubmit()
          }
        }}
        disabled={isLoading}
        ref={inputRef as any}
        loading={isLoading}
        autosize
        minRows={1} />
      {messages.length > 0 && !isLoading && (
        <Button size="sm" color="red" variant="light" onClick={() => clear()}>
          Clear
        </Button>
      )}
      {isLoading && (
        <ActionIcon color="red" variant="light" onClick={() => stop()}>
          <IconPlayerStopFilled />
        </ActionIcon>
      )}
    </HStack>
  )
}
