import { css } from '@likec4/styles/css'
import { HStack, Txt, VStack } from '@likec4/styles/jsx'
import { hstack } from '@likec4/styles/patterns'
import { Alert, Button, Code, Container, ScrollAreaAutosize, Text, ThemeIcon } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { type ErrorComponentProps, isNotFound, useParams, useRouter } from '@tanstack/react-router'
import { type PropsWithChildren, useEffect, useRef } from 'react'
import type { FallbackProps } from 'react-error-boundary'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { isError, isNullish, isObjectType } from 'remeda'

const hasMessageOrStack = (error: unknown): error is { stack?: string; message?: string; toString: () => string } => {
  return isObjectType(error) && error !== null && (Object.hasOwn(error, 'stack') || Object.hasOwn(error, 'message'))
}

function errorMessage(error: unknown): string {
  let message = 'Unknown error'
  try {
    switch (true) {
      case isNullish(error):
        message = 'Unknown error'
        break
      case isError(error):
        message = error.stack ?? error.message
        break
      case typeof error === 'string':
        message = error
        break
      case hasMessageOrStack(error):
        message = error.stack ?? error.message ?? error.toString()
        break
      default:
        message = String(error as any)
        break
    }
  } catch (e) {
    message = `${e}`
  }
  return message
}

function FallbackDialog({ error, resetErrorBoundary, children }: PropsWithChildren<FallbackProps>) {
  const errorString = errorMessage(error)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className={hstack({
        margin: '0',
        padding: '0',
        position: 'fixed',
        top: '10',
        left: '10',
        width: '[calc(100vw - ({spacing.10} * 2))]',
        height: 'max-content',
        maxHeight: '[min(calc(100vh - ({spacing.10} * 3)), 500px)]',
        background: `likec4.overlay.body`,
        rounded: 'sm',
        borderWidth: 3,
        borderColor: `likec4.overlay.border`,
        shadow: 'xl',
        outline: 'none',
        overflow: 'hidden',
        p: 'xl',
        gap: 'lg',
        alignItems: 'flex-start',
        flexWrap: 'nowrap',
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
      <ThemeIcon size={'md'} radius={'xl'} color="red">
        <IconX style={{ width: 20, height: 20 }} />
      </ThemeIcon>
      <VStack flex={'1'} gap={'2'} h="stretch" overflow={'hidden'}>
        <Txt flex="0">
          Oops, something went wrong
        </Txt>
        <ScrollAreaAutosize
          flex="1"
          maw={'100%'}
          type="auto"
          classNames={{
            root: css({
              background: 'surface.sunken',
              _hover: {
                background: 'surface.sunken.hover',
              },
              border: '2px solid {colors.surface.sunken.border}',
              rounded: 'sm',
            }),
            content: css({
              padding: '3',
            }),
          }}>
          <Txt textStyle={'dimmed.sm'} fontFamily={'mono'} style={{ whiteSpace: 'pre-wrap' }}>
            {errorString}
          </Txt>
        </ScrollAreaAutosize>
        <HStack gap={'md'} my="sm" flex="0">
          {children}
          <Text fz={'sm'} c={'dimmed'}>
            See console for more details and report the issue if it persists.
          </Text>
        </HStack>
      </VStack>
    </dialog>
  )
}

export function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  const router = useRouter()
  const params = useParams({
    strict: false,
  })
  if (isNotFound(error)) {
    return (
      <Container my={'md'}>
        <Alert variant="light" color="orange">
          <Text c={'orange'} fz={'md'}>
            The diagram{' '}
            <Code color="orange">
              {params.viewId ?? 'unknown'}
            </Code>{' '}
            does not exist or contains errors
          </Text>
          <Button
            onClick={() => {
              resetErrorBoundary()
              void router.navigate({
                to: '/',
              })
            }}
            variant="light"
            color="orange"
            mt={'lg'}
            size="xs">
            Go to overview
          </Button>
        </Alert>
      </Container>
    )
  }
  return (
    <FallbackDialog error={error} resetErrorBoundary={resetErrorBoundary}>
      <Button
        size="sm"
        variant="default"
        onClick={() => {
          void router.invalidate().finally(() => {
            resetErrorBoundary()
          })
        }}>
        Try again
      </Button>
      <Button
        size="sm"
        variant="default"
        onClick={() => {
          resetErrorBoundary()
          void router.navigate({ to: '/' })
        }}>
        Go to overview
      </Button>
    </FallbackDialog>
  )
}

export function ErrorComponent({ error, reset }: ErrorComponentProps) {
  return <Fallback error={error} resetErrorBoundary={reset} />
}

export function ErrorBoundary({ children }: PropsWithChildren) {
  return <ReactErrorBoundary FallbackComponent={Fallback}>{children}</ReactErrorBoundary>
}
