import type { Fqn, LikeC4Model } from '@likec4/core'
import { Alert, Box, Button, Group, Menu, rem, Text, ThemeIcon, Tree, useTree } from '@mantine/core'
import { IconInfoCircle, IconTarget, IconZoomScan } from '@tabler/icons-react'
import { type ReactNode, memo, useEffect, useMemo } from 'react'
import { useDiagram } from '../../hooks/useDiagram'
import { useLikeC4Model } from '../../likec4model/useLikeC4Model'
import { stopPropagation } from '../../utils'
import * as css from './TabPanelDeployments.css'

interface TreeNodeData {
  label: ReactNode
  value: string
  type: 'node' | 'instance'
  children: TreeNodeData[]
}

type TabPanelDeploymentsProps = {
  elementFqn: Fqn
}

const DeploymentNodeRenderer = ({
  node,
}: {
  node: LikeC4Model.DeploymentNode
}) => (
  <Group className={css.nodeLabel} gap={6} align="baseline" wrap="nowrap">
    <Text component="div" fz={11} c="dimmed">{node.kind}:</Text>
    <Text component="div" fz={'sm'} fw={'500'}>{node.title}</Text>
  </Group>
)

const DeployedInstanceRenderer = (
  {
    instance,
  }: {
    instance: LikeC4Model.DeployedInstance
  },
) => {
  const diagram = useDiagram()
  const currentViewId = diagram.currentView().id
  const views = [...instance.views()]
  return (
    (
      <Group className={css.instanceLabel} gap={4}>
        <ThemeIcon color="gray" variant="transparent" size={'xs'} flex={0}>
          <IconTarget stroke={1.2} />
        </ThemeIcon>
        <Text component="div" fz={'sm'} fw={'500'} flex={'1 1 100%'}>{instance.title}</Text>
        <Box onClick={stopPropagation} pos={'relative'} data-no-transform flex={0}>
          {views.length === 0 && (
            <Button size="compact-xs" variant="transparent" color="gray" disabled>
              no views
            </Button>
          )}
          {views.length > 0 && (
            <Menu
              shadow="md"
              withinPortal={false}
              position="bottom-start"
              offset={0}
              // trigger={'click-hover'}
              // openDelay={100}
              // closeDelay={200}
              closeOnClickOutside
              clickOutsideEvents={['pointerdown', 'mousedown', 'click']}
              closeOnEscape
              trapFocus
            >
              <Menu.Target>
                <Button size="compact-xs" variant="subtle" color="gray">
                  {views.length} view{views.length > 1 ? 's' : ''}
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                {views.map(view => (
                  <Menu.Item
                    key={view.id}
                    px={'xs'}
                    py={4}
                    disabled={view.id === currentViewId}
                    leftSection={
                      <ThemeIcon size={'sm'} variant="transparent" color="gray">
                        <IconZoomScan stroke={1.8} opacity={0.65} />
                      </ThemeIcon>
                    }
                    styles={{
                      itemSection: {
                        marginInlineEnd: rem(8),
                      },
                    }}
                    onClick={e => {
                      e.stopPropagation()
                      diagram.navigateTo(view.id)
                    }}>
                    {view.title}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          )}
        </Box>
      </Group>
    )
  )
}

export const TabPanelDeployments = memo<TabPanelDeploymentsProps>(({ elementFqn }) => {
  const element = useLikeC4Model(true).element(elementFqn)
  const deployments = [...element.deployments()]

  const tree = useTree({
    multiple: false,
  })

  const data = useMemo(() => {
    let roots = [] as TreeNodeData[]
    let treeItems = new Map<string, TreeNodeData>()

    for (const instance of element.deployments()) {
      let instanceNode: TreeNodeData = {
        label: <DeployedInstanceRenderer instance={instance} />,
        value: instance.id,
        type: 'instance' as const,
        children: [],
      }
      treeItems.set(instance.id, instanceNode)

      let ancestor = instance.parent as LikeC4Model.DeploymentNode | null
      while (ancestor) {
        let ancestorNode = treeItems.get(ancestor.id)
        if (ancestorNode) {
          ancestorNode.children.push(instanceNode)
          break
        }
        ancestorNode = {
          label: <DeploymentNodeRenderer node={ancestor} />,
          value: ancestor.id,
          type: 'node' as const,
          children: [instanceNode],
        }
        treeItems.set(ancestor.id, ancestorNode)
        instanceNode = ancestorNode
        ancestor = ancestor.parent
      }

      if (!ancestor && !roots.includes(instanceNode)) {
        roots.push(instanceNode)
      }
    }
    return roots
  }, [element])

  useEffect(() => {
    tree.expandAllNodes()
  }, [data])

  if (deployments.length === 0) {
    return (
      <Alert variant="light" color="gray" icon={<IconInfoCircle />}>
        This element does not have any deployments
      </Alert>
    )
  }

  return (
    // <Box></Box>
    <Tree
      levelOffset={'sm'}
      allowRangeSelection={false}
      classNames={{
        node: css.treeNode,
        label: css.treeNodeLabel,
      }}
      styles={{
        root: {
          position: 'relative',

          width: 'min-content',
          minWidth: 300,
        },
      }}
      data={data}
      tree={tree}
      renderNode={({ node, selected, elementProps, hasChildren }) => (
        <Box
          {...elementProps}
          style={{
            ...(!hasChildren && {
              marginBottom: rem(4),
            }),
          }}
        >
          {hasChildren
            ? (
              <Button
                fullWidth
                color={'gray'}
                variant={selected ? 'transparent' : 'subtle'}
                size="xs"
                justify="flex-start"
                styles={{
                  root: {
                    position: 'unset',
                    paddingInlineStart: rem(16),
                  },
                }}
              >
                {node.label}
              </Button>
            )
            : node.label}
        </Box>
      )}
    />
  )
})
