import { Box, HStack, Txt, VStack } from '@likec4/styles/jsx'
import { ActionIcon, CloseButton, Input } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'
import { AnimatePresence } from 'motion/react'
import { type ChangeEvent, Suspense } from 'react'
import { prop } from 'remeda'
import { Logo } from '../components/Logo'
import { ElementsTree } from './ElementsTree'
import {
  EditorPanelStoreProvider,
  selectEditorPanelState,
  useEditorPanelState,
  useEditorPanelTrigger,
} from './state/panel'

export const EditorPanel = () => {
  return (
    <EditorPanelStoreProvider>
      <AnimatePresence mode="popLayout">
        <VStack
          css={{
            position: 'fixed',
            top: '0',
            left: '0',
            gap: '1',
            bottom: '0',
            height: 'auto',
            overflow: 'hidden',
            layerStyle: 'likec4.panel',
            width: '[300px]',
            rounded: '0',
          }}
          onClick={(e) => {
            e.stopPropagation()
            const input = document.getElementById('search-input') as HTMLInputElement | null
            if (input) {
              input.focus()
            }
          }}
        >
          <HStack p={'2'} gap="4" justifyItems={'stretch'}>
            <Logo style={{ height: 16 }} />
            <Txt size="sm" fontWeight="medium" flex={'1'}>
              Explore
            </Txt>
            <HStack gap="1">
              <ActionIcon>
                <IconTrash />
              </ActionIcon>
            </HStack>
          </HStack>
          <Box>
            <SearchInput />
          </Box>
          <Suspense>
            <ElementsTree />
          </Suspense>
        </VStack>
      </AnimatePresence>
    </EditorPanelStoreProvider>
  )
}

const selectInput = selectEditorPanelState(prop('searchInput'))

function SearchInput() {
  const input = useEditorPanelState(selectInput)
  const trigger = useEditorPanelTrigger()
  const onChange = useEditorPanelTrigger((trigger, event: ChangeEvent<HTMLInputElement>) => {
    trigger.inputChange({ value: event.currentTarget.value })
  })

  const clear = useEditorPanelTrigger((trigger) => {
    trigger.inputChange({ value: '' })
  })

  return (
    <Box>
      <Input
        id="search-input"
        size="xs"
        variant="filled"
        placeholder="Search by title, description or start with # or kind:"
        value={input}
        onChange={onChange}
        data-likec4-search-input
        rightSectionPointerEvents="all"
        rightSection={
          <CloseButton
            size="sm"
            aria-label="Clear input"
            onClick={clear}
            style={{ display: input ? undefined : 'none' }}
          />
        }
        onKeyDownCapture={(e) => {
          switch (e.key) {
            case 'Escape': {
              e.stopPropagation()
              e.preventDefault()
              clear()
              break
            }
            case 'Enter': {
              e.stopPropagation()
              e.preventDefault()
              // editor.close()
              break
            }
            case 'ArrowDown': {
              e.stopPropagation()
              e.preventDefault()
              trigger.inputKeyDown()
              break
            }
            default: {
              return
            }
          }
        }}
      />
    </Box>
  )
}
