import { DashboardIcon, TriangleRightIcon } from '@radix-ui/react-icons'
import { Box, Flex, Text } from '@radix-ui/themes'
import TreeView, { type INode } from 'react-accessible-treeview'
import { useDiagramsTree } from '../../data'
import { $pages, useRoute } from '../../router'
import { cn } from '../../utils'
import styles from './DiagramsTree.module.css'

function inTree(id: string, data: INode[]): boolean {
  return data.some(d => d.id === id)
}

export function DiagramsTree() {
  const data = useDiagramsTree()
  const r = useRoute()

  const viewId = r.route === 'view' || r.route === 'export' ? r.params.viewId : null
  const selectedId = viewId && inTree(viewId, data) ? [viewId] : []

  return (
    <Box className={styles.treeview}>
      <TreeView
        data={data}
        propagateSelect
        propagateSelectUpwards
        selectedIds={selectedId}
        onNodeSelect={({ element, isBranch }) => {
          if (isBranch) {
            return
          }
          $pages.view.open('' + element.id)
        }}
        nodeRenderer={({
          element,
          isBranch,
          isExpanded,
          getNodeProps,
          handleExpand,
          handleSelect
        }) => {
          return (
            <Flex
              {...getNodeProps({ onClick: isBranch ? handleExpand : handleSelect })}
              align={'center'}
              gap={isBranch ? '1' : '2'}
            >
              {isBranch && (
                <Box style={{ lineHeight: '15px' }}>
                  <TriangleRightIcon
                    width={15}
                    height={15}
                    className={cn('transition duration-200 ease-out', isExpanded && 'rotate-90')}
                  />
                </Box>
              )}
              {!isBranch && (
                <Box style={{ lineHeight: '14px' }} width={'min-content'}>
                  <DashboardIcon width={14} height={14} />
                </Box>
              )}
              <Box asChild grow={'1'}>
                <Text
                  as='div'
                  size={'2'}
                  weight={isBranch ? 'bold' : undefined}
                  className='truncate'
                >
                  {(isBranch ? '🗂️ ' : '') + element.name}
                </Text>
              </Box>
            </Flex>
          )
        }}
      />
    </Box>
  )
}
