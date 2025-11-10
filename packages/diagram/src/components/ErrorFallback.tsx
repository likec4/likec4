import { css } from '@likec4/styles/css'
import { HStack, VStack } from '@likec4/styles/jsx'
import { Button, ScrollAreaAutosize, Text, ThemeIcon } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { useEffect, useRef } from 'react'
import {
  type ErrorBoundaryProps,
  type FallbackProps,
  ErrorBoundary as ErrorBoundaryComponent,
} from 'react-error-boundary'

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorString = error instanceof Error ? error.message : 'Unknown error'
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className={css({
        margin: '0',
        padding: '0',
        position: 'fixed',
        top: '10',
        left: '10',
        width: '[calc(100vw - ({spacing.10} * 2))]',
        height: 'max-content',
        maxHeight: '[calc(100vh - ({spacing.10} * 3))]',
        background: `likec4.overlay.body`,
        rounded: 'sm',
        borderWidth: 3,
        borderColor: `likec4.overlay.border`,
        shadow: 'xl',
        outline: 'none',
        _backdrop: {
          cursor: 'zoom-out',
          backdropFilter: `blur(18px)`,
          bg: '[color-mix(in oklab, {colors.likec4.overlay.backdrop} 60%, transparent)]',
        },
      })}
      onClick={e => {
        e.stopPropagation()
        if ((e.target as any)?.nodeName?.toUpperCase() === 'DIALOG') {
          dialogRef.current?.close()
          return
        }
      }}
      onClose={e => {
        e.stopPropagation()
        resetErrorBoundary()
      }}
    >
      <HStack p={'xl'} gap={'lg'} alignItems={'flex-start'} flexWrap={'nowrap'}>
        <ThemeIcon size={'md'} radius={'xl'} color="red">
          <IconX style={{ width: 20, height: 20 }} />
        </ThemeIcon>
        <VStack flex={'1'}>
          <Text fz={'md'}>
            Oops, something went wrong
          </Text>
          <ScrollAreaAutosize maw={'100%'} mah={400} type="auto">
            <Text fz={'md'} c={'red'} style={{ whiteSpace: 'pre-wrap', userSelect: 'all' }}>
              {errorString}
            </Text>
          </ScrollAreaAutosize>
          <HStack gap={'md'} mt="md">
            <Button size="sm" variant="default" onClick={() => resetErrorBoundary()}>Reset</Button>
            <Text fz={'sm'} c={'dimmed'}>
              See console for more details and report the issue if it persists.
            </Text>
          </HStack>
        </VStack>
      </HStack>
    </dialog>
  )
}

export function ErrorBoundary(props: Pick<ErrorBoundaryProps, 'onReset' | 'onError' | 'children'>) {
  return (
    <ErrorBoundaryComponent
      FallbackComponent={ErrorFallback}
      onError={(err, info) => {
        console.error(err, info)
      }}
      {...props} />
  )
}
