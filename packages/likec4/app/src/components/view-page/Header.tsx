import { type DiagramView } from '@likec4/core'
import {
  Button,
  Divider,
  Group,
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTarget,
  Paper,
  Text,
  useMantineTheme
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { IconBrandReact, IconChevronDown, IconFile, IconShare } from '@tabler/icons-react'
import { Link, type RegisteredRouter, type RouteIds, useParams, useRouterState } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { findLast } from 'remeda'
import { ColorSchemeToggle } from '../ColorSchemeToggle'
import * as css from './Header.css'
import { ShareModal } from './ShareModal'

type RegisteredRoute = RouteIds<RegisteredRouter['routeTree']>

type HeaderProps = {
  diagram: DiagramView
}

export function Header({ diagram }: HeaderProps) {
  const { breakpoints } = useMantineTheme()
  const isTablet = useMediaQuery(`(min-width: ${breakpoints.md})`) ?? false
  const [opened, { open, close }] = useDisclosure(false)
  return (
    <Paper
      className={css.cssHeader}
      pos={'fixed'}
      top={'0.5rem'}
      right={'0.5rem'}
      py={5}
      px={'xs'}
      radius={'sm'}
      shadow="xl">
      <Group gap={isTablet ? 6 : 4} wrap="nowrap">
        <ViewPageButton isTablet={isTablet} />
        <ColorSchemeToggle />
        <Divider orientation="vertical" mr={isTablet ? 4 : 'xs'} />
        <Button size={isTablet ? 'sm' : 'xs'} leftSection={<IconShare size={14} />} onClick={open}>
          Share
        </Button>
        <ExportButton diagram={diagram} />
      </Group>
      <ShareModal
        opened={opened}
        onClose={close}
        diagram={diagram} />
    </Paper>
  )
}

const viewPages = [
  {
    route: '/view/$viewId',
    icon: <IconBrandReact opacity={0.7} size={16} />,
    title: <>React</>
  },
  {
    route: '/view/$viewId/editor',
    icon: <IconBrandReact opacity={0.7} size={16} />,
    title: (
      <Text size="sm" fw={'500'} variant="gradient" gradient={{ from: 'pink', to: 'violet', deg: 90 }}>
        Editor
      </Text>
    )
  },
  {
    route: '/view/$viewId/dot',
    icon: <IconFile opacity={0.7} size={16} />,
    title: (
      <>
        Graphviz <Text component="span" size="xs" c={'dimmed'} ml={4}>.dot</Text>
      </>
    )
  },
  {
    route: '/view/$viewId/d2',
    icon: <IconFile opacity={0.7} size={16} />,
    title: <>D2</>
  },
  {
    route: '/view/$viewId/mmd',
    icon: <IconFile opacity={0.7} size={16} />,
    title: <>Mermaid</>
  }
] as const satisfies Array<{ route: RegisteredRoute; icon: ReactNode; title: ReactNode }>

const routeIds = viewPages.map(({ route }) => route as string)

function ViewPageButton({
  isTablet
}: {
  isTablet: boolean
}) {
  const { viewId } = useParams({
    from: '/view/$viewId'
  })
  const routerState = useRouterState()
  const matchedRoute = findLast(routerState.matches, ({ routeId }) => routeIds.includes(routeId))
  const matched = (matchedRoute && viewPages.find(({ route }) => route === matchedRoute.routeId)) ?? viewPages[0]
  return (
    <>
      <Menu shadow="md" width={200} trigger="click-hover" openDelay={100}>
        <MenuTarget>
          <Button
            leftSection={matched.icon}
            variant="subtle"
            size={isTablet ? 'sm' : 'xs'}
            color="gray"
            px={'xs'}
            rightSection={<IconChevronDown opacity={0.5} size={14} />}>
            {matched.title}
          </Button>
        </MenuTarget>

        <MenuDropdown>
          {viewPages.map(({ route, icon, title }) => (
            <MenuItem
              key={route}
              component={Link}
              to={route}
              search
              params={{ viewId }}
              leftSection={icon}
              {...(route === matched.route ? { bg: 'gray' } : {})}
              style={{
                whiteSpace: 'nowrap'
              }}
            >
              {title}
            </MenuItem>
          ))}
        </MenuDropdown>
      </Menu>
    </>
  )
}

function downloadImage(name: string, dataUrl: string) {
  const a = document.createElement('a')
  a.setAttribute('download', `${name}.png`)
  a.setAttribute('href', dataUrl)
  a.click()
}

function ExportButton({ diagram }: HeaderProps) {
  const params = useParams({
    from: '/view/$viewId'
  })

  const onClick = async () => {
    const { toPng } = await import('html-to-image')
    const imageWidth = diagram.bounds.width + 32
    const imageHeight = diagram.bounds.height + 32
    const viewPort = document.querySelector<HTMLDivElement>('.react-flow__viewport')
    if (!viewPort) {
      return
    }
    try {
      const data = await toPng(viewPort, {
        backgroundColor: 'transparent',
        width: imageWidth,
        height: imageHeight,
        cacheBust: true,
        imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
        style: {
          width: imageWidth + 'px',
          height: imageHeight + 'px',
          transform: `translate(16px, 16px) scale(1)`
        }
      })
      downloadImage(diagram.id, data)
    } catch (err) {
      console.error(err)
      window.alert(`Failed to export to PNG, check the console for more details.`)
    }
  }

  return (
    <Menu shadow="md" width={200} trigger="click-hover" openDelay={200}>
      <MenuTarget>
        <Button
          variant="subtle"
          size="sm"
          color="gray"
          px={'sm'}
          rightSection={<IconChevronDown opacity={0.5} size={14} />}
          visibleFrom="md">
          Export
        </Button>
      </MenuTarget>

      <MenuDropdown>
        <MenuLabel>Current view</MenuLabel>
        <MenuItem onClick={onClick}>Export as .png</MenuItem>
        <MenuItem component={Link} to={'/view/$viewId/dot'} search params={params}>Export as .dot</MenuItem>
        <MenuItem component={Link} to={'/view/$viewId/d2'} search params={params}>Export as .d2</MenuItem>
        <MenuItem component={Link} to={'/view/$viewId/mmd'} search params={params}>Export as .mmd</MenuItem>
        <MenuItem disabled>Export to Draw.io</MenuItem>
        <MenuItem disabled>Export to Miro</MenuItem>
        <MenuItem disabled>Export to Notion</MenuItem>

        <MenuDivider />
        <MenuLabel>All views</MenuLabel>
        <MenuItem disabled>
          Download as ZIP
        </MenuItem>
      </MenuDropdown>
    </Menu>
  )
}
