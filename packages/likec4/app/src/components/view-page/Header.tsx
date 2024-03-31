import type { DiagramView } from '@likec4/core'
import { Badge, Box, Button, Center, Code, Divider, Flex, Group, HoverCard, Menu, Text, Title } from '@mantine/core'
import { Dialog } from '@radix-ui/themes'
import { IconBrandReact, IconChevronDown, IconFile, IconShare } from '@tabler/icons-react'
import { Link, type RegisteredRouter, type RouteIds, useMatchRoute, useParams } from '@tanstack/react-router'
import { memo } from 'react'
import { isEmpty } from 'remeda'
import { ColorSchemeToggle } from '../ColorSchemeToggle'
import { cssHeader } from './Header.css'
import { ShareDialog } from './ShareDialog'

type RegisteredRoute = RouteIds<RegisteredRouter['routeTree']>

type HeaderProps = {
  diagram: DiagramView
}

export function Header({ diagram }: HeaderProps) {
  return (
    <header className={cssHeader}>
      <DiagramTitle diagram={diagram} />

      <Group gap={'sm'}>
        <ViewPageButton />
        <ColorSchemeToggle />
        <Divider orientation="vertical" />
        <Dialog.Root>
          <Dialog.Trigger>
            <Button ml={'xs'} size="sm" leftSection={<IconShare size={14} />}>
              Share
            </Button>
          </Dialog.Trigger>
          <ShareDialog diagram={diagram} />
        </Dialog.Root>
        <ExportButton />
      </Group>
    </header>
    // <Flex
    //   position={'fixed'}
    //   top='0'
    //   left='0'
    //   width={'100%'}
    //   className={styles.header}
    //   justify='between'
    //   align={'stretch'}
    //   gap={'4'}
    //   p={'2'}
    // >
    //   <Flex pl='7' grow='1' gap={'2'} shrink='1' align={'stretch'} wrap={'nowrap'}>
    //     <DiagramTitle diagram={diagram} />
    //     <DiagramLinks diagram={diagram} />
    //   </Flex>
    //   <ViewActions diagram={diagram} />
    // </Flex>
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
        React <Text component="span" size="xs" c={'dimmed'}>(pre 1.0)</Text>
      </>
    )
  },
  {
    route: '/view/$viewId/dot',
    icon: <IconFile opacity={0.7} size={16} />,
    title: (
      <>
        Graphviz <Text component="span" size="xs" c={'dimmed'}>.dot</Text>
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

const ViewPageButton = memo(function ViewPageButtonFn() {
  const { viewId } = useParams({
    from: '/view/$viewId'
  })
  const matchRoute = useMatchRoute()
  const matched = viewPages.find(({ route }) => matchRoute({ to: route }) !== false) ?? viewPages[0]
  return (
    <>
      {matched.route === '/view/$viewId' && (
        <Center h="100%">
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
        <Menu.Target>
          <Button
            leftSection={matched.icon}
            variant="subtle"
            size="sm"
            color="gray"
            rightSection={<IconChevronDown opacity={0.5} size={14} />}>
            {matched.title}
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          {viewPages.map(({ route, icon, title }) => (
            <Menu.Item
              key={route}
              component={Link}
              to={route}
              startTransition
              params={{ viewId }}
              leftSection={icon}
              style={{
                whiteSpace: 'nowrap'
              }}
            >
              {title}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </>
  )
})

function ExportButton() {
  return (
    <Menu shadow="md" width={200} trigger="click-hover" openDelay={200}>
      <Menu.Target>
        <Button variant="subtle" size="sm" color="gray" rightSection={<IconChevronDown opacity={0.5} size={14} />}>
          Export
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Current view</Menu.Label>
        <Menu.Item>Export as .png</Menu.Item>
        <Menu.Item>Export as .dot</Menu.Item>
        <Menu.Item>Export as .d2</Menu.Item>
        <Menu.Item>Export as .mmd</Menu.Item>
        <Menu.Item disabled>Export to Draw.io</Menu.Item>
        <Menu.Item disabled>Export to Miro</Menu.Item>
        <Menu.Item disabled>Export to Notion</Menu.Item>

        <Menu.Divider />
        <Menu.Label>All views</Menu.Label>
        <Menu.Item disabled>
          Download as ZIP
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}

function DiagramTitle({ diagram }: HeaderProps) {
  const hasDescription = !isEmpty(diagram.description?.trim())
  return (
    <HoverCard closeDelay={500} position="bottom-start">
      <HoverCard.Target>
        <Flex px={'3'} align={'center'}>
          <Title order={4}>
            {diagram.title || 'Untitled'}
          </Title>
        </Flex>
      </HoverCard.Target>
      <HoverCard.Dropdown>
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
      </HoverCard.Dropdown>
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
