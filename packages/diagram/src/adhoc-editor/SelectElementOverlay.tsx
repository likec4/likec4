import { css, cx } from '@likec4/styles/css'
import { VStack } from '@likec4/styles/jsx'
import { center, flex, vstack } from '@likec4/styles/patterns'
import { Button, Input, ScrollAreaAutosize } from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import { normalizeProps, useMachine } from '@zag-js/react'
import * as tree from '@zag-js/tree-view'
import { AnimatePresence, m } from 'motion/react'
import { useId, useState } from 'react'
import { useLikeC4Model } from '../hooks/useLikeC4Model'
import { Overlay } from '../overlays/overlay/Overlay'
import { selectFromContext, selectFromSnapshot, useAdhocEditor, useAdhocEditorSnapshot } from './hooks'
import { TreeBranch, TreeItem } from './TreeNode'
import { type TreeNodeData, createTreeCollection } from './useElementsTree'

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

  const likec4model = useLikeC4Model()

  const [collection, setCollection] = useState(
    () => createTreeCollection(likec4model),
  )

  const service = useMachine(tree.machine as tree.Machine<TreeNodeData>, {
    id: useId(),
    collection,
    defaultSelectedValue: [],
    // checkedValue,
    defaultExpandedValue: [],
    // defaultFocusedValue: null,
    // onCheckedChange({ checkedValue }) {
    //   setCheckedValue(checkedValue)
    // },
    // onSelectionChange({ focusedValue, selectedNodes }) {
    //   const node = focusedValue ? selectedNodes.find(n => n.id === focusedValue) : null
    //   if (!node) return
    //   if (node.children.length > 0) {
    //     const isExpanded = api.expandedValue.includes(node.id)
    //     const isChecked = api.checkedValue.includes(node.id)
    //     if (!isExpanded && !isChecked) {
    //       api.toggleChecked(node.id, true)
    //       api.expand([node.id])
    //     }
    //     return
    //   }
    //   api.toggleChecked(node.id, false)
    // },
  })

  const api = tree.connect(service, normalizeProps)

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
        {...api.getRootProps() as any}
        scrollbars="y"
        type="scroll"
        classNames={{
          content: vstack({
            alignItems: 'stretch',
          }),
        }}>
        <div {...api.getTreeProps()}>
          {collection.rootNode.children!.map((node, index) => (
            <TreeNode key={node.fqn} node={node} indexPath={[index]} api={api} />
          ))}
        </div>
        {
          /* {elements.map(el => (
          <styled.button
            key={el.id}
            onClick={e => {
              e.stopPropagation()
              editor.include(el)
              editor.close()
            }}>
            {el.title}
          </styled.button>
        ))} */
        }
      </ScrollAreaAutosize>
    </VStack>
  )
}

type TreeApi = tree.Api<any, TreeNodeData>

const TreeNode = ({ api, node, indexPath }: {
  node: TreeNodeData
  api: TreeApi
  indexPath: number[]
}) => {
  const nodeProps = { indexPath, node }

  const state = api.getNodeState(nodeProps)

  if (node.children.length) {
    const indeterminate = state.checked === 'indeterminate'
    return (
      <TreeBranch.Root {...api.getBranchProps(nodeProps)}>
        <TreeBranch.Control {...api.getBranchControlProps(nodeProps)}>
          <TreeBranch.Checkbox
            {...api.getNodeCheckboxProps(nodeProps)}
            checked={state.checked === true}
            indeterminate={indeterminate}
          />
          <TreeBranch.Label {...api.getBranchTextProps(nodeProps)}>
            {node.title}
            <TreeBranch.Indicator {...api.getBranchIndicatorProps(nodeProps)} />
          </TreeBranch.Label>
          <TreeBranch.Description>
          </TreeBranch.Description>
        </TreeBranch.Control>
        <TreeBranch.Content {...api.getBranchContentProps(nodeProps)}>
          {state.expanded && node.children && (
            <>
              <TreeBranch.ContentHeader>
                LEVELS
              </TreeBranch.ContentHeader>
              {node.children?.map((childNode, index) => (
                <TreeNode
                  key={childNode.fqn}
                  node={childNode}
                  indexPath={[...indexPath, index]}
                  api={api}
                />
              ))}
            </>
          )}
        </TreeBranch.Content>
      </TreeBranch.Root>
    )
  }

  // const { onClick, ...itemsProps } =
  return (
    <TreeItem.Root
      {...api.getItemProps(nodeProps)}
    >
      <TreeItem.Checkbox
        {...api.getNodeCheckboxProps(nodeProps)}
        checked={state.checked === true}
      />
      <div>
        <TreeItem.Label {...api.getItemTextProps(nodeProps)}>
          {node.title}
        </TreeItem.Label>
        <TreeItem.Description>
        </TreeItem.Description>
      </div>
    </TreeItem.Root>
  )
}
