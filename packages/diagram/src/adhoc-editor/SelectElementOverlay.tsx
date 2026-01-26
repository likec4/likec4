import { css, cx } from '@likec4/styles/css'
import { styled, VStack } from '@likec4/styles/jsx'
import { center, flex, vstack } from '@likec4/styles/patterns'
import { Button, Input, ScrollAreaAutosize } from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import { AnimatePresence, m } from 'motion/react'
import { useLikeC4Model } from '../hooks/useLikeC4Model'
import { Overlay } from '../overlays/overlay/Overlay'
import { selectFromContext, selectFromSnapshot, useAdhocEditor, useAdhocEditorSnapshot } from './hooks'

const selectIfEmpty = selectFromContext(c => !c.view || c.view.nodes.length === 0)
function SelectElementsButton({ onClick }: { onClick: () => void }) {
  const isEmpty = useAdhocEditorSnapshot(selectIfEmpty)
  return (
    <m.div
      layout="position"
      layoutId="select-button-container"
      className={cx(
        flex({
          pointerEvents: 'none',
          position: 'absolute',
          justifyContent: 'center',
        }),
        isEmpty && center({ inset: '0' }),
        !isEmpty && css({
          top: '3',
          width: '100%',
        }),
      )}>
      <Button
        component={m.button}
        layout="position"
        layoutId="select-button"
        className={css({
          pointerEvents: 'all',
        })}
        size={isEmpty ? 'xl' : 'lg'}
        variant="default"
        radius={isEmpty ? 'xl' : 'lg'}
        onClick={onClick}>
        Add elements
      </Button>
    </m.div>
  )
}

const isSelecting = selectFromSnapshot(s => s.value.editor === 'selecting')
export function SelectElementOverlay() {
  const editor = useAdhocEditor()
  const isOpened = useAdhocEditorSnapshot(isSelecting)
  return (
    <AnimatePresence mode="popLayout">
      <SelectElementsButton key="select-button" onClick={() => editor.open()} />
      {isOpened && (
        <Overlay key="select-overlay" onClose={() => editor.close()}>
          <SelectElementOverlayBody />
        </Overlay>
      )}
    </AnimatePresence>
  )
}

function SelectElementOverlayBody() {
  const editor = useAdhocEditor()
  const [input, setInput] = useInputState('')

  const elements = useLikeC4Model().elements().toArray()

  return (
    <VStack h={'100%'} flex={'1'} alignItems={'stretch'}>
      <Input
        size="lg"
        variant="unstyled"
        placeholder="Search by title, description or start with # or kind:"
        autoFocus
        data-autofocus
        value={input}
        onChange={setInput}
        data-likec4-search-input
        onKeyDownCapture={(e) => {
          switch (e.key) {
            case 'Escape': {
              e.stopPropagation()
              e.preventDefault()
              editor.close()
              break
            }
            case 'Enter': {
              e.stopPropagation()
              e.preventDefault()
              editor.close()
              break
            }
            default: {
              return
            }
          }
        }}
      />
      <ScrollAreaAutosize
        scrollbars="y"
        type="scroll"
        classNames={{
          content: vstack({
            alignItems: 'stretch',
          }),
        }}>
        {elements.map(el => (
          <styled.button
            key={el.id}
            onClick={e => {
              e.stopPropagation()
              editor.include(el)
              editor.close()
            }}>
            {el.title}
          </styled.button>
        ))}
      </ScrollAreaAutosize>
    </VStack>
  )
}
