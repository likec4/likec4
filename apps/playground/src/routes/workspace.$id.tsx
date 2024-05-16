import {
  AppShell,
  Box,
  Button,
  Divider,
  Group,
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTarget,
  Stack
} from '@mantine/core'
import { IconChevronDown, IconShare } from '@tabler/icons-react'
import { createFileRoute, Link, Outlet, useRouter } from '@tanstack/react-router'
import { nanoid } from 'nanoid'
import { Logo } from '../components/Logo'
import { WorkspaceContextProvider } from '../state'
import { BigBankExample, BlankExample } from '../state/examples'

export const Route = createFileRoute('/workspace/$id')({
  component: WorkspaceContextPage,
  loader: ({ params }) => {
    switch (params.id) {
      case 'blank':
        return BlankExample
      case 'bigbank':
        return BigBankExample
      default:
        return BlankExample
    }
  }
})

export function WorkspaceContextPage() {
  const { id } = Route.useParams()
  const data = Route.useLoaderData()

  const isCustom = id !== 'blank' && id !== 'bigbank'

  return (
    <AppShell
      header={{ height: 55 }}
      withBorder={false}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Logo
            style={{
              height: 20
            }} />

          <Group gap={'4'}>
            {
              /* <Button
              variant="light"
              color="gray"
              component={Link}
              to={'/workspace/$id/'}
              params={{ id: nanoid(6) }}
              size="xs">
              Create playground
            </Button> */
            }
            {isCustom && (
              <Button
                leftSection={<IconShare size={14} />}
                size="xs">
                Share
              </Button>
            )}
            <ExportButton />
            <Divider orientation="vertical" />
            <Button
              component="a"
              variant="subtle"
              size="xs"
              color="gray"
              visibleFrom="md">
              Docs
            </Button>
          </Group>

          {
            /* <Link to={'/workspace/$id/'} params={{ id: 'blank' }}>Blank</Link>
          <Link to={'/workspace/$id/'} params={{ id: 'bigbank' }}>BigBank</Link> */
          }
        </Group>
      </AppShell.Header>
      <AppShell.Main h={'100dvh'}>
        <WorkspaceContextProvider key={id} name={id} {...data}>
          <Outlet />
        </WorkspaceContextProvider>
      </AppShell.Main>
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

function ExportButton() {
  return (
    <Menu shadow="md" width={160} trigger="click-hover" openDelay={200}>
      <MenuTarget>
        <Button
          variant="subtle"
          size="xs"
          color="gray"
          rightSection={<IconChevronDown opacity={0.5} size={14} />}
          visibleFrom="md">
          Playgrounds
        </Button>
      </MenuTarget>

      <MenuDropdown>
        <MenuItem component={Link} to={'/workspace/$id/'} params={{ id: nanoid(6) }}>Blank...</MenuItem>
        <MenuDivider />
        <MenuLabel>Examples</MenuLabel>
        <MenuItem component={Link} to={'/workspace/$id/'} params={{ id: 'bigbank' }}>BigBank</MenuItem>
      </MenuDropdown>
    </Menu>
  )
}
