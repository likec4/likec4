import type { DiagramView } from '@likec4/core'
import {
  Badge,
  Box,
  Button,
  Center,
  Code,
  Divider,
  Flex,
  Group,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  Menu,
  MenuDivider,
  MenuDropdown,
  MenuItem,
  MenuLabel,
  MenuTarget,
  Text,
  useMantineTheme
} from '@mantine/core'
import { useDisclosure, useMediaQuery } from '@mantine/hooks'
import { IconBrandReact, IconChevronDown, IconFile, IconShare } from '@tabler/icons-react'
import { Link, type RegisteredRouter, type RouteIds, useParams, useRouterState } from '@tanstack/react-router'
import { findLast, isEmpty } from 'remeda'
import { ColorSchemeToggle } from '../ColorSchemeToggle'
import { cssDiagramTitle, cssDiagramTitleBox, cssHeader } from './Header.css'
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
    <header className={cssHeader}>
      <DiagramTitle diagram={diagram} />

      <Group gap={isTablet ? 'xs' : 4} visibleFrom="xs" flex={'0 0 auto'}>
        <ViewPageButton isTablet={isTablet} />
        <ColorSchemeToggle />
        <Divider orientation="vertical" />
        <Button ml={'xs'} size={isTablet ? 'sm' : 'xs'} leftSection={<IconShare size={14} />} onClick={open}>
          Share
        </Button>
        <ExportButton diagram={diagram} />
      </Group>
      <ShareModal
        opened={opened}
        onClose={close}
        diagram={diagram} />
    </header>
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
    route: '/view/$viewId/react-legacy',
    icon: <IconBrandReact opacity={0.7} size={16} />,
    title: (
      <>
        React <Text component="span" size="xs" c={'dimmed'} ml={4}>(pre 1.0)</Text>
      </>
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
] as const satisfies Array<{ route: RegisteredRoute; icon: React.ReactNode; title: React.ReactNode }>

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
      {matched.route === '/view/$viewId' && (
        <Center h="100%" visibleFrom="md">
          <Link
            to={`/view/$viewId/editor`}
            params={{ viewId }}
            style={{
              display: 'inline-block',
              lineHeight: '16px'
            }}>
            <Badge
              size="xs"
              radius="xs"
              variant="gradient"
              gradient={{ from: 'pink', to: 'violet', deg: 90 }}
            >
              editor preview
            </Badge>
          </Link>
        </Center>
      )}
      <Menu shadow="md" width={200} trigger="click-hover" openDelay={100}>
        <MenuTarget>
          <Button
            leftSection={matched.icon}
            variant="subtle"
            size={isTablet ? 'sm' : 'xs'}
            color="gray"
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
    const imageWidth = diagram.width + 32
    const imageHeight = diagram.height + 32
    toPng(document.querySelector<HTMLDivElement>('.react-flow__viewport')!, {
      backgroundColor: 'transparent',
      width: imageWidth,
      height: imageHeight,
      cacheBust: true,
      style: {
        width: imageWidth + 'px',
        height: imageHeight + 'px',
        transform: `translate(16px, 16px) scale(1)`
      }
    }).then(data => downloadImage(diagram.id, data))
  }

  return (
    <Menu shadow="md" width={200} trigger="click-hover" openDelay={200}>
      <MenuTarget>
        <Button
          variant="subtle"
          size="sm"
          color="gray"
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

function DiagramTitle({ diagram }: {
  diagram: DiagramView
}) {
  const hasDescription = !isEmpty(diagram.description?.trim())
  return (
    <HoverCard closeDelay={500} position="bottom-start">
      <HoverCardTarget>
        <Flex px={'3'} align={'center'} className={cssDiagramTitleBox}>
          <Text className={cssDiagramTitle}>
            {diagram.title || 'Untitled'}
          </Text>
        </Flex>
      </HoverCardTarget>
      <HoverCardDropdown>
        <Flex direction="column" gap={'xs'}>
          <HoverCardItem title="view id">
            <Code color="gray">
              {diagram.id}
            </Code>
          </HoverCardItem>
          {diagram.viewOf && (
            <HoverCardItem title="view of">
              <Code>{diagram.viewOf}</Code>
            </HoverCardItem>
          )}
          <HoverCardItem title="description">
            {hasDescription
              ? (
                <Text component="p" style={{ whiteSpace: 'pre-line' }}>
                  {diagram.description?.trim()}
                </Text>
              )
              : (
                <Text c={'dimmed'} fz={'xs'}>
                  no description
                </Text>
              )}
          </HoverCardItem>
        </Flex>
      </HoverCardDropdown>
    </HoverCard>
  )
}
function HoverCardItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text size="xs" c="dimmed">
        {title}
      </Text>
      {children}
    </Box>
  )
}

// function DiagramLinks({ diagram: { links } }: HeaderProps) {
//   if (!links) {
//     return null
//   }
//   if (links.length > 1) {
//     return (
//       <Flex align={'center'}>
//         <Box grow={'0'} height={'4'}>
//           <HoverCard.Root closeDelay={500}>
//             <HoverCard.Trigger>
//               <IconButton color="gray" variant="ghost" size={'2'}>
//                 <Link2Icon width={16} height={16} />
//               </IconButton>
//             </HoverCard.Trigger>
//             <HoverCard.Content size={'2'} align="center">
//               <Flex direction="column" gap="2">
//                 {links.map(link => (
//                   <Flex asChild align={'center'} gap={'2'} key={link}>
//                     <Link href={link} target="_blank">
//                       <ExternalLinkIcon width={13} height={13} />
//                       <Text size="2">{link}</Text>
//                     </Link>
//                   </Flex>
//                 ))}
//               </Flex>
//             </HoverCard.Content>
//           </HoverCard.Root>
//         </Box>
//       </Flex>
//     )
//   }
//   const link = links[0]
//   return (
//     <Flex align={'center'}>
//       <Tooltip content={link}>
//         <Box grow={'0'}>
//           <IconButton asChild color="gray" variant="ghost" size={'2'}>
//             <Link href={link} target="_blank">
//               <Link2Icon width={16} height={16} />
//             </Link>
//           </IconButton>
//         </Box>
//       </Tooltip>
//     </Flex>
//   )
// }
