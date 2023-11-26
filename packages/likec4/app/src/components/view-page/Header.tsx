import { Badge, Box, Button, Flex, Heading, HoverCard, HoverCardRoot, Text } from '@radix-ui/themes'
import styles from './Header.module.css'
import type { DiagramView } from '@likec4/core'
import { ViewActions } from '..'
import { isEmpty } from 'remeda'

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
      <Flex pl='7' grow='1' shrink='1' align={'stretch'}>
        <DiagramTitle diagram={diagram} />
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
          {/* <Button color='gray' variant='ghost' highContrast size={'3'}> */}
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
        {/* </Button> */}
      </HoverCard.Trigger>
      <HoverCard.Content size={'1'}>
        <Flex direction='column' gap='3'>
          <HoverCardItem title='view id'>
            <Badge color='gray' size='1'>
              {diagram.id}
            </Badge>
          </HoverCardItem>
          {diagram.viewOf && (
            <HoverCardItem title='view of'>
              <Badge size='1'>{diagram.viewOf}</Badge>
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
