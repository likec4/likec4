import { AppShell, AppShellHeader, AppShellMain } from '@mantine/core'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { BlankExample, Examples } from '../examples'
import { WorkspaceContextProvider } from '../state'
import { Header } from './-workspace/Header'

export const Route = createFileRoute('/w/$id')({
  component: WorkspaceContextPage,
  loader: ({ params }) => {
    const id = params.id as keyof typeof Examples
    return Examples[id] ?? {
      isCustom: true,
      ...BlankExample
    }
  }
})

export function WorkspaceContextPage() {
  const { id } = Route.useParams()
  const { isCustom, ...data } = Route.useLoaderData()

  return (
    <AppShell
      header={{ height: 50 }}
      // withBo rder={false}
    >
      <WorkspaceContextProvider key={id} name={id} {...data}>
        <AppShellHeader>
          <Header />
        </AppShellHeader>
        <AppShellMain h={'100dvh'}>
          <Outlet />
        </AppShellMain>
      </WorkspaceContextProvider>
    </AppShell>
    // <Stack pos={'fixed'} inset={0}>
    //   <Group flex={0}>

    //   </Group>
    //   <Box flex={1}>
    //     <WorkspaceContextProvider key={id} name={id}>
    //       <Outlet />
    //     </WorkspaceContextProvider>
    //   </Box>
    // </Stack>
  )
}
