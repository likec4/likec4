import { Header } from '$/components/appshell/Header'
import { AppShell, AppShellHeader, AppShellMain, Box } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import * as css from './styles.css'

// export const Route = createFileRoute('/')({
//   component: IndexRoute,
// })

export const Route = createFileRoute('/')({
  component: () => {
    return <Navigate to="/w/$workspaceId/" params={{ workspaceId: 'tutorial' }} />
  },
})
