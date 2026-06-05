import { css } from '@likec4/styles/css'
import { HStack, Txt, VStack } from '@likec4/styles/jsx'
import {
  ActionIcon,
  Badge,
  CloseButton,
  FloatingWindow,
  ScrollAreaAutosize,
  Tooltip,
} from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { useTimeoutEffect } from '@react-hookz/web'
import { IconSparkles } from '@tabler/icons-react'
import { AIAdapter } from 'likec4:rpc'
import { AnimatePresence, m } from 'motion/react'
import { useRef } from 'react'
import { ChatContext } from './ChatContext'
import { ChatInput } from './ChatInput'
import { ChatMessages } from './ChatMessage'
import { SemanticLayoutLog } from './SemanticLayoutLog'
import { useChat } from './useChat'

type Position = { left?: number; top?: number; right?: number; bottom?: number }

const storage = {
  key: 'likec4.ai.chat.position',
  read(): Position | null {
    try {
      const stored = localStorage.getItem(this.key)
      if (!stored) return null
      return JSON.parse(stored)
    } catch {
      return null
    }
  },
  write<T extends Position | null>(position: T): T {
    try {
      if (position === null) {
        localStorage.removeItem(this.key)
        return position
      }
      localStorage.setItem(this.key, JSON.stringify(position))
    } catch {
      // ignore
    }
    return position
  },
}
export default function AIChatComponent() {
  const initialPosition = useRef<{ left?: number; top?: number; right?: number; bottom?: number }>(null)
  if (!initialPosition.current) {
    initialPosition.current = storage.read() ?? { right: 16, bottom: 100 }
  }
  const onPositionChange = (pos: { x: number; y: number }) => {
    initialPosition.current = storage.write({ left: pos.x, top: pos.y })
  }

  const [isCollapsed, setCollapsed] = useLocalStorage({
    key: 'likec4.ai.chat.collapsed',
    defaultValue: true,
  })

  return (
    <>
      <AnimatePresence>
        {!isCollapsed && (
          <FloatingWindow
            w={300}
            pos="fixed"
            className={css({
              rounded: 'md',
              padding: 'xs',
              shadow: 'md',
              layerStyle: 'likec4.panel',
            })}
            constrainToViewport
            constrainOffset={8}
            excludeDragHandleSelector=".chat-input"
            initialPosition={initialPosition.current}
            onPositionChange={onPositionChange}
          >
            <AIChatWindowContent onClose={() => setCollapsed(true)} />
          </FloatingWindow>
        )}
        {isCollapsed && (
          <m.div
            key={'collapsed'}
            initial={{ opacity: 0.1, translateX: '10%' }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{
              translateX: '50%',
              opacity: 0.1,
            }}
            style={{
              position: 'fixed',
              right: 8,
              bottom: 60,
              zIndex: 1000,
            }}
          >
            <Tooltip label="Show AI Assistant" color="dark" fz={'xs'}>
              <ActionIcon
                size={'lg'}
                variant="gradient"
                onClick={() => setCollapsed(false)}
              >
                <IconSparkles stroke={1.5} />
              </ActionIcon>
            </Tooltip>
          </m.div>
        )}
      </AnimatePresence>
      <SemanticLayoutLog />
    </>
  )
}

function AIChatWindowContent({ onClose }: { onClose: () => void }) {
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const scrollIntoView = () => {
    scrollAnchorRef.current?.scrollIntoView()
  }

  useTimeoutEffect(() => {
    scrollIntoView()
  }, 100)

  const chat = useChat({
    onChunk: scrollIntoView,
  })
  return (
    <ChatContext value={chat}>
      <VStack w="100%">
        <HStack cursor={'move'} justify="space-between">
          <HStack>
            <Txt textStyle="likec4.panel" noUserSelect>AI Assistant</Txt>
            <Badge size="xs" radius={'sm'} variant="light">{AIAdapter}</Badge>
          </HStack>
          <CloseButton
            size={'sm'}
            onClick={e => {
              e.stopPropagation()
              onClose()
            }} />
        </HStack>
        <ScrollAreaAutosize
          scrollbars="y"
          w="100%"
          flex={1}
          mih={250}
          mah={350}
          classNames={{
            content: css({
              display: 'contents',
            }),
          }}>
          <VStack>
            <ChatMessages />
            <div ref={scrollAnchorRef} style={{ height: 2 }}></div>
          </VStack>
        </ScrollAreaAutosize>
        <ChatInput />
      </VStack>
    </ChatContext>
  )
}
