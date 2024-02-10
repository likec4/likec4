import type { DiagramView } from '@likec4/diagrams'
import { Diagram } from '@likec4/diagrams'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { Box, Card, Container, Flex, Heading, IconButton, Inset, Section, Separator, Text } from '@radix-ui/themes'
import { useDebouncedEffect } from '@react-hookz/web'
import type { Atom } from 'jotai'
import { useAtomValue } from 'jotai'
import { memo, useState } from 'react'
import { isEmpty } from 'remeda'
import { useViewGroupsAtoms, type ViewsGroup as IViewsGroup } from '../../data'
import { $pages } from '../../router'
import { cn } from '../../utils'
import styles from './index.module.css'

const DiagramPreview = memo((props: { diagram: DiagramView }) => {
  const [diagram, setDiagram] = useState<DiagramView | null>(null)

  // defer rendering to update to avoid flickering
  useDebouncedEffect(
    () => {
      setDiagram(props.diagram)
    },
    [props.diagram],
    50
  )

  return (
    <Box className={styles.previewBg} style={{ width: 350, height: 175 }}>
      {diagram && (
        <Diagram
          animate={false}
          pannable={false}
          zoomable={false}
          minZoom={0.1}
          maxZoom={1}
          diagram={diagram}
          padding={[4, 6, 4, 6]}
          width={350}
          height={175}
        />
      )}
    </Box>
  )
})

type ViewCardAtom = IViewsGroup['views'][number]
const ViewCard = ({ atom }: { atom: ViewCardAtom }) => {
  // const diagram =
  const diagram = useAtomValue(atom)
  const { id, title, description } = diagram
  return (
    <Box asChild shrink="0" grow="1">
      <Card asChild style={{ width: 350, maxWidth: 350 }} variant="surface" size="1">
        <a href={$pages.view.url(id).href}>
          <Inset clip="padding-box" side="top" pb="current">
            <DiagramPreview diagram={diagram} />
          </Inset>
          <Text as="div" size="2" weight="bold" trim="start">
            {title || id}
          </Text>
          <Text
            as="div"
            color="gray"
            size="2"
            my="1"
            className={cn(isEmpty(description?.trim()) && styles.dimmed)}
            style={{
              whiteSpace: 'pre-line'
            }}
          >
            {description?.trim() || 'no description'}
          </Text>
        </a>
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
            className={cn(isRoot || styles.dimmed)}
            trim="end"
          >
            views
          </Heading>
          {!isRoot && (
            <>
              <Heading color="gray" className={styles.dimmed} trim={'end'}>
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
