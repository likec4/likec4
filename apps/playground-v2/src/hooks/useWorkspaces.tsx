import { Examples } from '$/examples'
import { WorkspacePersistence } from '$state/persistence'
import type { LocalWorkspace } from '$state/types'
import { invariant } from '@likec4/core'
import { Button, Group, TextInput } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { useRouter } from '@tanstack/react-router'
import { nanoid } from 'nanoid'
import { createRef } from 'react'
import type { SetOptional } from 'type-fest'
import { useOptionalPlaygroundActorRef } from './usePlayground'

export const LikeC4WorkspacesKey = 'likec4:workspaces'
export type LocalStorageWorkspace = {
  key: string
  name: string // path-prefix
  title: string
}

export function useWorkspaces() {
  const router = useRouter()
  const playgroundActorRef = useOptionalPlaygroundActorRef()

  const [workspaces, setWorkspaces] = useLocalStorage<LocalStorageWorkspace[]>({
    key: LikeC4WorkspacesKey,
    defaultValue: [],
  })

  const removeWorkspace = (name: string) => {
    const workspace = workspaces.find(w => w.name === name)
    if (!workspace) return
    setWorkspaces(workspaces.filter(w => w.name !== name))
    localStorage.removeItem(workspace.key)
  }

  const createNewFromBlank = () => {
    const workspaceId = nanoid(6)
    const title = `Blank ${workspaceId}`
    openNewWorkspaceModal(
      title,
      createWorkspaceWithEnteredTitle({
        workspaceId,
        activeFilename: Examples.blank.currentFilename,
        files: {
          ...Examples.blank.files,
        },
      }),
    )
  }

  const createNewFromCurrent = () => {
    const context = playgroundActorRef?.getSnapshot().context
    invariant(context)
    const { workspaceTitle, activeFilename, files } = context
    const title = `Copy of ${workspaceTitle}`
    openNewWorkspaceModal(
      title,
      createWorkspaceWithEnteredTitle({
        workspaceId: nanoid(6),
        activeFilename,
        files: { ...files },
      }),
    )
  }

  const openNewWorkspaceModal = (title: string, next: (name: string) => void) => {
    // const inputId = nanoid(4)
    const inputRef = createRef<HTMLInputElement>()
    const modalId = modals.open({
      title: 'New playground',
      size: 'sm',
      radius: 'xs',
      withCloseButton: false,
      children: (
        <>
          <TextInput placeholder="Playground name" defaultValue={title} data-autofocus ref={inputRef} />
          <Group mt="lg" align="flex-end">
            <Button
              size="sm"
              onClick={() => {
                const workspaceName = inputRef.current?.value ?? title
                queueMicrotask(() => {
                  next(workspaceName)
                })
                modals.close(modalId)
              }}>
              Create
            </Button>
          </Group>
        </>
      ),
    })
  }

  const createWorkspaceWithEnteredTitle = (workspace: {
    workspaceId: string
    activeFilename: string
    files: Record<string, string>
  }) =>
  (title: string) => {
    const key = WorkspacePersistence.write({
      ...workspace,
      title,
    })
    setWorkspaces((workspaces) => [
      ...workspaces,
      {
        key,
        name: workspace.workspaceId,
        title,
      },
    ])
    router.navigate({
      to: '/w/$workspaceId/$viewId/',
      params: {
        workspaceId: workspace.workspaceId,
        viewId: 'index',
      },
    })
  }

  const createNew = (workspace: SetOptional<LocalWorkspace, 'workspaceId'>) => {
    const workspaceId = workspace.workspaceId ?? nanoid(6)
    if (workspaces.some(w => w.name === workspaceId)) {
      alert(`Workspace ${workspaceId} already exists`)
      router.navigate({
        to: '/w/$workspaceId/$viewId/',
        params: {
          workspaceId,
          viewId: 'index',
        },
      })
      return
    }
    const key = WorkspacePersistence.write({
      ...workspace,
      workspaceId,
    })
    setWorkspaces((workspaces) => [
      ...workspaces,
      {
        key,
        name: workspaceId,
        title: workspace.title,
      },
    ])
    router.navigate({
      to: '/w/$workspaceId/$viewId/',
      params: {
        workspaceId,
        viewId: 'index',
      },
    })
  }

  return [workspaces, {
    setWorkspaces,
    removeWorkspace,
    createNewFromBlank,
    createNewFromCurrent,
    createNew,
  }] as const
}
