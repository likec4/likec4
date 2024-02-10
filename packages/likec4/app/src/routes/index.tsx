import { createFileRoute, Link } from '@tanstack/react-router'

import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { Box, Card, Container, Flex, Heading, IconButton, Inset, Section, Separator, Text } from '@radix-ui/themes'
import type { Atom } from 'jotai'
import { useAtomValue } from 'jotai'
import { useViewGroupsAtoms, type ViewsGroup as IViewsGroup } from '../data'

export const Route = createFileRoute('/')({
  component: IndexPage
})
type ViewCardAtom = IViewsGroup['views'][number]
const ViewCard = ({ atom }: { atom: ViewCardAtom }) => {
  // const diagram =
  const diagram = useAtomValue(atom)
  const { id, title, description } = diagram
  return (
    <Box asChild shrink="0" grow="1">
      <Card asChild style={{ width: 350, maxWidth: 350 }} variant="surface" size="1">
        <Link to="/view/$viewId/editor" params={{ viewId: id }} search>
          <Inset clip="padding-box" side="top" pb="current">
            {/* <DiagramPreview diagram={diagram} /> */}
          </Inset>
          <Text as="div" size="2" weight="bold" trim="start">
            {title || id}
          </Text>
          <Text
            as="div"
            color="gray"
            size="2"
            my="1"
            // className={cn(isEmpty(description?.trim()) && styles.dimmed)}
            style={{
              whiteSpace: 'pre-line'
            }}
          >
            {description?.trim() || 'no description'}
          </Text>
        </Link>
      </Card>
    </Box>
  )
}

function ViewsGroup({ atom }: { atom: Atom<IViewsGroup> }) {
  const { path, views, isRoot } = useAtomValue(atom)
  return (
    <Flex asChild gap={'4'} direction={'column'}>
      <Section size="2">
        <Flex gap="2">
          <Heading
            color={isRoot ? undefined : 'gray'}
            // className={cn(isRoot || styles.dimmed)}
            trim="end"
          >
            views
          </Heading>
          {!isRoot && (
            <>
              <Heading
                color="gray"
                //  className={styles.dimmed}
                trim={'end'}>
                /
              </Heading>
              <Heading trim={'end'}>{path}</Heading>
            </>
          )}
        </Flex>
        <Separator orientation="horizontal" my="2" size={'4'} />
        <Flex
          gap={{
            initial: '4',
            md: '6'
          }}
          wrap={{
            initial: 'nowrap',
            md: 'wrap'
          }}
          direction={{
            initial: 'column',
            md: 'row'
          }}
          align="stretch"
        >
          {views.map(v => <ViewCard key={v.toString()} atom={v} />)}
        </Flex>
      </Section>
    </Flex>
  )
}

export function IndexPage() {
  const viewGroupsAtoms = useViewGroupsAtoms()
  return (
    <Container
      size={'4'}
      px={{
        initial: '3',
        lg: '1'
      }}
    >
      {viewGroupsAtoms.map(g => <ViewsGroup key={g.toString()} atom={g} />)}
      {viewGroupsAtoms.length === 0 && (
        <Flex position="fixed" inset="0" align="center" justify="center">
          <Card color="red" size="4">
            <Flex gap="4" direction="row" align="center">
              <Box grow="0" shrink="0" pt="1">
                <IconButton variant="ghost" color="red">
                  <ExclamationTriangleIcon width={20} height={20} />
                </IconButton>
              </Box>
              <Flex gap="3" direction="column">
                <Heading trim="both" color="red" size="4">
                  No diagrams found
                </Heading>
              </Flex>
            </Flex>
          </Card>
        </Flex>
      )}
    </Container>
  )
}
