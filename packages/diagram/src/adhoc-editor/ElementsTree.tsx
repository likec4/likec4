import type { Fqn } from '@likec4/core/types'
import { invariant } from '@likec4/core/utils'
import { Box } from '@likec4/styles/jsx'
import { ScrollArea } from '@mantine/core'
import { mergeProps } from '@zag-js/react'
import { type KeyboardEvent, type MouseEvent, memo } from 'react'
import { Tree } from './components/Tree'
import { useEditorPanelTrigger } from './state/panel'
import { type TreeApi, type TreeNodeData, useElementsTree } from './useElementsTree'

export const ElementsTree = memo(() => {
  const api = useElementsTree()

  const onClick = useEditorPanelTrigger((trigger, event: MouseEvent) => {
    const id = event.currentTarget.closest('[data-value]')?.getAttribute('data-value') as Fqn | undefined
    if (!id) {
      return
    }
    try {
      event.stopPropagation()
      event.preventDefault()
      api.expand([id])
      trigger.elementClick({ id })
    } catch (err) {
      console.error('Failed to handle element click', err)
    }
  })

  const rootProps = mergeProps(api.getRootProps(), {
    onKeyDown: (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': {
          const input = document.getElementById('search-input') as HTMLInputElement | null
          if (input) {
            e.stopPropagation()
            e.preventDefault()
            input.focus()
          }
          break
        }
        case 'ArrowUp': {
          console.log('ArrowUp', {
            selected: api.selectedValue,
          })
          // e.stopPropagation()
          // e.preventDefault()
          break
        }
        default: {
          console.log(e.key)
          return
        }
      }
    },
    // onClick: useCallbackRef((e: MouseEvent) => {
    //   const lastnd = last(api.getVisibleNodes())
    //   if (lastnd) {
    //     e.stopPropagation()
    //     api.focus(lastnd.node.id)
    //   }
    // }),
  })

  return (
    <ScrollArea
      flex="1 1 100%"
      scrollbars="y"
      type="scroll"
      scrollbarSize={'4px'}
      {
        // className="arsars"
        // styles={{
        //   content: {
        //     height: '100%',
        //   },
        // }}
        // viewportProps={{
        //   onClick: (e) => {
        //     const lastnd = api.getVisibleNodes().at(-1)?.node
        //     if (lastnd) {
        //       e.preventDefault()
        //       e.stopPropagation()
        //       setTimeout(() => {
        //         api.focus(lastnd.id)
        //       }, 50)
        //     }
        //   },
        // }}
        ...rootProps
      }
    >
      <Tree.Root {...api.getTreeProps()}>
        {api.collection.rootNode.children.map((node, index) => (
          <TreeNode
            key={node.id}
            node={node}
            api={api}
            // indexPath={[index]}
            onClick={onClick}
          />
        ))}
        {!api.collection.getFirstNode() && (
          <Box
            css={{
              p: '4',
              textAlign: 'center',
            }}>
            Nothing found
          </Box>
        )}
      </Tree.Root>
    </ScrollArea>
  )
})

const TreeNode = ({ api, node, onClick }: {
  node: TreeNodeData
  api: TreeApi
  // indexPath: number[]
  onClick: (event: MouseEvent) => void
}) => {
  const indexPath = api.collection.getIndexPath(node.id)
  invariant(indexPath, 'Node not found in collection')

  const nodeProps = { indexPath, node }

  const state = api.getNodeState(nodeProps)

  if (state.isBranch) {
    // const indeterminate = state.checked === 'indeterminate'
    return (
      <Tree.Branch {...api.getBranchProps(nodeProps)}>
        <Tree.Control {...api.getBranchControlProps(nodeProps)}>
          <Tree.Icon element={node} />
          <Tree.Label {...api.getBranchTextProps(nodeProps)}>
            {node.title}
            <Tree.Indicator {...api.getBranchIndicatorProps(nodeProps)} />
          </Tree.Label>
          <Tree.State node={node} state={node.state} onClick={onClick} />
        </Tree.Control>
        <Tree.Content {...api.getBranchContentProps(nodeProps)}>
          {state.expanded && node.children.map((childNode, index) => (
            <TreeNode
              key={childNode.id}
              node={childNode}
              // indexPath={[...indexPath, index]}
              api={api}
              onClick={onClick}
            />
          ))}
        </Tree.Content>
      </Tree.Branch>
    )
  }

  // const { onClick, ...itemsProps } =
  return (
    <Tree.Item {...api.getItemProps(nodeProps)}>
      <Tree.Icon element={node} />
      <Tree.Label {...api.getItemTextProps(nodeProps)}>
        {node.title}
      </Tree.Label>
      <Tree.State node={node} state={node.state} onClick={onClick} />
    </Tree.Item>
  )
}
