import { Group, Paper, Text, ThemeIcon } from '@mantine/core'
import { IconFileFilled, IconFolderFilled } from '@tabler/icons-react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import clsx from 'clsx'
import { memo } from 'react'
import { isNullish } from 'remeda'
import * as css from './Nodes.css'
import type { FileXYNode, FolderXYNode } from './types'

type FolderXYNodeProps = NodeProps<FolderXYNode>

export const FolderNode = /* @__PURE__ */ memo(function FolderNode({
  data,
  parentId,
  id
}: FolderXYNodeProps) {
  const isTopLevel = isNullish(parentId)
  return (
    <>
      <Handle type="target" position={Position.Top} className={css.handleCenter} />
      <Paper
        p={'sm'}
        pt={'xs'}
        radius={'md'}
        withBorder
        shadow={isTopLevel ? 'lg' : 'xs'}
        className={clsx(
          css.folderNode,
          isTopLevel ? css.toplevelNode : css.nestedNode,
          data.dimmed && css.dimmed
        )}>
        <Group gap={8}>
          <ThemeIcon size={24} variant="transparent" color="dark.4">
            <IconFolderFilled size={'100%'} />
          </ThemeIcon>
          <Text size="lg" fw={500}>
            {data.label}
          </Text>
        </Group>
      </Paper>
      <Handle type="source" position={Position.Bottom} className={css.handleCenter} />
    </>
  )
})

type FileXYNodeProps = NodeProps<FileXYNode>
export const FileNode = /* @__PURE__ */ memo(function FileNode({
  data,
  parentId,
  id
}: FileXYNodeProps) {
  const isTopLevel = isNullish(parentId)
  return (
    <>
      <Handle type="target" position={Position.Top} className={css.handleCenter} />
      <Paper
        p={'sm'}
        pt={'xs'}
        radius={'md'}
        withBorder
        shadow={isTopLevel ? 'lg' : 'xs'}
        className={clsx(
          css.fileNode,
          isTopLevel ? css.toplevelNode : css.nestedNode,
          data.dimmed && css.dimmed
        )}>
        <Group gap={8}>
          <ThemeIcon size={24} variant="transparent" color="dark.3">
            <IconFileFilled size={'100%'} />
          </ThemeIcon>
          <Text size="lg" fw={500}>
            {data.label}
          </Text>
        </Group>
      </Paper>
      <Handle type="source" position={Position.Bottom} className={css.handleCenter} />
    </>
  )
})
