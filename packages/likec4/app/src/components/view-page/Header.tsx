import type { DiagramView } from '@likec4/core'
import {
  Button,
  Divider,
  Group,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTarget,
  Paper,
  Space,
  useMantineTheme
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { IconChevronDown, IconShare } from '@tabler/icons-react'
import { Link, type RegisteredRouter, type RouteIds, useParams, useRouterState } from '@tanstack/react-router'
import { usePreviewUrl } from 'virtual:likec4/previews'
import { ColorSchemeToggle } from '../ColorSchemeToggle'
import * as css from './Header.css'
import { ShareModal } from './ShareModal'

type RegisteredRoute = RouteIds<RegisteredRouter['routeTree']>

type HeaderProps = {
  diagram: DiagramView
}

export function Header({ diagram }: HeaderProps) {
  const routerState = useRouterState()
  const isReactDiagramRoute = routerState.matches.some(({ routeId }) =>
    routeId === '/view/$viewId/' || routeId === '/view/$viewId/editor'
  )

  const { breakpoints } = useMantineTheme()
  const isTablet = useMediaQuery(`(min-width: ${breakpoints.md})`) ?? false
  const [opened, { open, close }] = useDisclosure(false)
  return (
    <Paper
      className={css.cssHeader}
      pos={'fixed'}
      top={'0.5rem'}
      right={'0.5rem'}
      p={4}
      radius={'sm'}
      shadow="lg">
      <Group gap={isTablet ? 6 : 4} wrap="nowrap">
        {isReactDiagramRoute
          ? (
            <>
              {/* <ViewPageButton isTablet={isTablet} /> */}

              <Button size={isTablet ? 'sm' : 'xs'} leftSection={<IconShare size={14} />} onClick={open}>
                Share
              </Button>
              <ExportButton />
            </>
          )
          : (
            <Button
              component={Link}
              to={'/view/$viewId/'}
              size={isTablet ? 'sm' : 'xs'}
              variant="subtle"
              color="gray">
              Back to diagram
            </Button>
          )}

        <Divider orientation="vertical" visibleFrom="md" />
        <ColorSchemeToggle />
        <Space />
      </Group>
      <ShareModal
        opened={opened}
        onClose={close}
        diagram={diagram} />
    </Paper>
  )
}

// const viewPages = [
//   {
//     route: '/view/$viewId',
//     icon: <IconBrandReact opacity={0.7} size={16} />,
//     title: <>React</>
//   },
//   {
//     route: '/view/$viewId/editor',
//     icon: <IconBrandReact opacity={0.7} size={16} />,
//     title: (
//       <Text size="sm" fw={'500'} variant="gradient" gradient={{ from: 'pink', to: 'violet', deg: 90 }}>
//         Editor
//       </Text>
//     )
//   },
//   {
//     route: '/view/$viewId/dot',
//     icon: <IconFile opacity={0.7} size={16} />,
//     title: (
//       <>
//         Graphviz <Text component="span" size="xs" c={'dimmed'} ml={4}>.dot</Text>
//       </>
//     )
//   },
//   {
//     route: '/view/$viewId/d2',
//     icon: <IconFile opacity={0.7} size={16} />,
//     title: <>D2</>
//   },
//   {
//     route: '/view/$viewId/mmd',
//     icon: <IconFile opacity={0.7} size={16} />,
//     title: <>Mermaid</>
//   }
// ] as const satisfies Array<{ route: RegisteredRoute; icon: ReactNode; title: ReactNode }>

// const routeIds = viewPages.map(({ route }) => route as string)

// function ViewPageButton({
//   isTablet
// }: {
//   isTablet: boolean
// }) {
//   const { viewId } = useParams({
//     from: '/view/$viewId'
//   })
//   const routerState = useRouterState()
//   const matchedRoute = findLast(routerState.matches, ({ routeId }) => routeIds.includes(routeId))
//   const matched = (matchedRoute && viewPages.find(({ route }) => route === matchedRoute.routeId)) ?? viewPages[0]
//   return (
//     <>
//       <Menu shadow="md" width={200} trigger="click-hover" openDelay={100}>
//         <MenuTarget>
//           <Button
//             leftSection={matched.icon}
//             variant="subtle"
//             size={isTablet ? 'sm' : 'xs'}
//             color="gray"
//             px={'xs'}
//             rightSection={<IconChevronDown opacity={0.5} size={14} />}>
//             {matched.title}
//           </Button>
//         </MenuTarget>

//         <MenuDropdown>
//           {viewPages.map(({ route, icon, title }) => (
//             <MenuItem
//               key={route}
//               component={Link}
//               to={route}
//               search
//               params={{ viewId }}
//               leftSection={icon}
//               {...(route === matched.route ? { bg: 'gray' } : {})}
//               style={{
//                 whiteSpace: 'nowrap'
//               }}
//             >
//               {title}
//             </MenuItem>
//           ))}
//         </MenuDropdown>
//       </Menu>
//     </>
//   )
// }

function ExportButton() {
  const params = useParams({
    from: '/view/$viewId'
  })
  const previewUrl = usePreviewUrl(params.viewId)

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
        {previewUrl
          ? (
            <MenuItem
              component={'a'}
              href={previewUrl}
              download={`${params.viewId}.png`}
              target="_blank">
              Export as .png
            </MenuItem>
          )
          : (
            <MenuItem
              component={Link}
              to={'/export/$viewId'}
              target="_blank"
              search={{
                download: true
              }}
              params={params}>
              Export as .png
            </MenuItem>
          )}

        <MenuItem component={Link} to={'/view/$viewId/dot'} search params={params}>Export as .dot</MenuItem>
        <MenuItem component={Link} to={'/view/$viewId/d2'} search params={params}>Export as .d2</MenuItem>
        <MenuItem component={Link} to={'/view/$viewId/mmd'} search params={params}>Export as .mmd</MenuItem>
        <MenuItem disabled>Export to Draw.io</MenuItem>
        <MenuItem disabled>Export to Miro</MenuItem>
        <MenuItem disabled>Export to Notion</MenuItem>
        {
          /*
        <MenuDivider />
        <MenuLabel>All views</MenuLabel>
        <MenuItem disabled>
          Download as ZIP
        </MenuItem> */
        }
      </MenuDropdown>
    </Menu>
  )
}
