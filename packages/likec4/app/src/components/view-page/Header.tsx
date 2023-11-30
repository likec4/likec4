import type { DiagramView } from '@likec4/core'
import { ExternalLinkIcon, Link2Icon } from '@radix-ui/react-icons'
import {
  Box,
  Code,
  Flex,
  Heading,
  HoverCard,
  IconButton,
  Link,
  Text,
  Tooltip
} from '@radix-ui/themes'
import { isEmpty } from 'remeda'
import { ViewActions } from './ViewActions'
import styles from './Header.module.css'

type HeaderProps = {
  diagram: DiagramView
}

export function Header({ diagram }: HeaderProps) {
  return (
    <Flex
      position={'fixed'}
      top='0'
      left='0'
      width={'100%'}
      className={styles.header}
      justify='between'
      align={'stretch'}
      gap={'4'}
      p={'2'}
    >
      <Flex pl='7' grow='1' gap={'2'} shrink='1' align={'stretch'} wrap={'nowrap'}>
        <DiagramTitle diagram={diagram} />
        <DiagramLinks diagram={diagram} />
      </Flex>
      <ViewActions diagram={diagram} />
    </Flex>
  )
}

function DiagramTitle({ diagram }: HeaderProps) {
  const hasDescription = !isEmpty(diagram.description?.trim())
  return (
    <HoverCard.Root closeDelay={500}>
      <HoverCard.Trigger>
        <Flex px={'3'} className={styles.title} align={'center'}>
          <Heading
            size={{
              initial: '2',
              sm: '3',
              md: '4'
            }}
            trim={'both'}
            weight={'medium'}
          >
            {diagram.title || 'Untitled'}
          </Heading>
        </Flex>
      </HoverCard.Trigger>
      <HoverCard.Content size={'2'} className={styles.titleHoverCardContent}>
        <Flex direction='column' gap='3'>
          <HoverCardItem title='view id'>
            <Code color='gray' size='2'>
              {diagram.id}
            </Code>
          </HoverCardItem>
          {diagram.viewOf && (
            <HoverCardItem title='view of'>
              <Code size='2'>{diagram.viewOf}</Code>
            </HoverCardItem>
          )}
          <HoverCardItem title='description'>
            {hasDescription ? (
              <Text as='p' size='2' style={{ whiteSpace: 'pre-line' }}>
                {diagram.description?.trim()}
              </Text>
            ) : (
              <Text as='p' size='2' className={styles.dimmed}>
                no description
              </Text>
            )}
          </HoverCardItem>
        </Flex>
      </HoverCard.Content>
    </HoverCard.Root>
  )
}
function HoverCardItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text as='p' size='1' color='gray'>
        {title}
      </Text>
      {children}
    </Box>
  )
}

function DiagramLinks({ diagram: { links } }: HeaderProps) {
  if (!links) {
    return null
  }
  if (links.length > 1) {
    return (
      <Flex align={'center'}>
        <Box grow={'0'} height={'4'}>
          <HoverCard.Root closeDelay={500}>
            <HoverCard.Trigger>
              <IconButton color='gray' variant='ghost' size={'2'}>
                <Link2Icon width={16} height={16} />
              </IconButton>
            </HoverCard.Trigger>
            <HoverCard.Content size={'2'} align='center'>
              <Flex direction='column' gap='2'>
                {links.map(link => (
                  <Flex asChild align={'center'} gap={'2'} key={link}>
                    <Link href={link} target='_blank'>
                      <ExternalLinkIcon width={13} height={13} />
                      <Text size='2'>{link}</Text>
                    </Link>
                  </Flex>
                ))}
              </Flex>
            </HoverCard.Content>
          </HoverCard.Root>
        </Box>
      </Flex>
    )
  }
  const link = links[0]
  return (
    <Flex align={'center'}>
      <Tooltip content={link}>
        <Box grow={'0'}>
          <IconButton asChild color='gray' variant='ghost' size={'2'}>
            <Link href={link} target='_blank'>
              <Link2Icon width={16} height={16} />
            </Link>
          </IconButton>
        </Box>
      </Tooltip>
    </Flex>
  )
}
