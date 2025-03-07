import { api } from '$/api'
import { css } from '$styled-system/css'
import { Box } from '$styled-system/jsx'
import {} from '@likec4/core'
import {
  Button,
  Center,
  Container,
  Paper,
  PinInput,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useAsync, useLocalStorageValue, usePrevious } from '@react-hookz/web'
import { IconRosetteDiscountCheck } from '@tabler/icons-react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { isEmpty } from 'remeda'

export const Route = createFileRoute('/share/$shareId/enter-pincode')({
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const { shareId } = Route.useParams()
  const {
    value: pincode = '',
    set: setPincode,
  } = useLocalStorageValue('last-entered-pincode', {
    defaultValue: '' as string,
  })
  const initialPincode = useRef(pincode)
  const prev = usePrevious(pincode)

  const [data, checkPin] = useAsync(async () => await api.share.checkPin(shareId, pincode))

  useEffect(() => {
    if (pincode.length === 4) {
      checkPin.execute()
    }
  }, [])

  const result = data.result
  let pincodeValid = false
  let pincodeError = null as string | null
  if (result) {
    pincodeValid = result.valid
    if (!result.valid) {
      pincodeError = result.error
    }
  }

  useEffect(() => {
    if (pincodeValid) {
      const goto = () =>
        router.navigate({
          to: '/share/$shareId/view/$viewId/',
          params: {
            shareId,
            viewId: 'index',
          },
          replace: true,
        })

      // we show the success message for 600ms
      // if only the pincode was entered (not directly from local storage)
      if (initialPincode.current !== pincode) {
        setTimeout(goto, 600)
      } else {
        goto()
      }
    }
  }, [pincodeValid])

  return (
    <Container size={460} my={30}>
      <Paper withBorder shadow="md" px={32} py={48} radius="md">
        <Stack>
          {pincodeValid
            ? (
              <>
                <div>
                  <Title ta="center">
                    Access granted
                  </Title>
                </div>
                <Center mt={'md'}>
                  <IconRosetteDiscountCheck
                    className={css({
                      color: 'green.6',
                    })}
                    size={100} />
                </Center>
              </>
            )
            : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  await checkPin.execute()
                }}
                className={css({
                  display: 'contents',
                })}
              >
                <div>
                  <Title ta="center">
                    Access with pincode
                  </Title>
                  <Text c="dimmed" fz="sm" ta="center">
                    Enter pincode to access this playground
                  </Text>
                </div>
                {pincodeError && (
                  <Box textAlign={'center'}>
                    <Box
                      className={css({
                        display: 'inline-block',
                        bg: 'red.light',
                        color: 'red',
                        py: 'xs',
                        px: 'md',
                      })}>
                      {pincodeError}
                    </Box>
                  </Box>
                )}
                <Center mt={'md'}>
                  <PinInput
                    size="lg"
                    autoFocus
                    value={pincode}
                    onChange={setPincode}
                    onComplete={value => value.substring(0, 3) === prev?.substring(0, 3) && checkPin.execute()}
                    disabled={data.status === 'loading'}
                  />
                </Center>
                <Center mt={'xl'}>
                  <Button
                    type="submit"
                    loading={data.status === 'loading'}
                    disabled={pincode.trim().length < 4}
                  >
                    Open
                  </Button>
                </Center>
              </form>
            )}
        </Stack>
      </Paper>
    </Container>
  )
}
