import { PricingAnchor } from '$components/PricingAnchor'
import { useAtom } from '$hooks/useAtom'
import { usePlayground, usePlaygroundSnapshot } from '$hooks/usePlayground'
import { ShareOptions } from '$state/shareOptions'
import { css } from '$styled-system/css'
import { HStack } from '$styled-system/jsx'
import { hstack } from '$styled-system/patterns'
import {
  Alert as MantineAlert,
  Anchor,
  Box,
  Button as MantineButton,
  Checkbox,
  CopyButton,
  Group,
  Input,
  InputLabel,
  PinInput,
  Select,
  Stack,
  Text,
  UnstyledButton,
} from '@mantine/core'
import { useClipboard } from '@mantine/hooks'
import { useStore } from '@nanostores/react'
import { IconExternalLink } from '@tabler/icons-react'
import { useRouter } from '@tanstack/react-router'
import { $access, $expires, $forkable, $generateBtnDisabled, $pincode, generateRandomPincode } from './shareFormState'

const Button = MantineButton.withProps({
  size: 'xs',
  px: 'xs',
})

const Alert = MantineAlert.withProps({
  color: 'red',
  radius: 'sm',
  classNames: {
    root: css({
      maxW: 400,
      padding: 'xs',
    }),
    body: css({
      gap: '1',
    }),
    label: css({
      fontSize: 'xs',
    }),
  },
})

export function SharePlaygroundForm() {
  const router = useRouter()
  const { isShareInProgress, viewId, shareRequest } = usePlaygroundSnapshot(s => ({
    isShareInProgress: s.matches('sharing'),
    viewId: s.context.activeViewId ?? 'index',
    shareRequest: s.context.shareRequest
      ? {
        success: s.context.shareRequest.success ?? null,
        error: s.context.shareRequest.error ?? null,
      }
      : null,
  }))

  const shareLinkHref = shareRequest?.success && router.buildLocation({
    to: '/share/$shareId/',
    params: {
      shareId: shareRequest.success.shareId,
    },
  }).href
  const shareLink = shareLinkHref ? `${window.location.origin}${shareLinkHref}` : null

  const [expires, setExpires] = useAtom($expires)
  const [access, setAccess] = useAtom($access)
  const [pincode, setPincode] = useAtom($pincode)
  const [forkable, setForkable] = useAtom($forkable)
  const btnDisabled = useStore($generateBtnDisabled)

  const playground = usePlayground()

  const { copy, copied } = useClipboard({ timeout: 800 })

  return (
    <>
      <div
        className={css({
          alignSelf: 'flex-start',
          opacity: 0.85,
          fontSize: 'sm',
          fontWeight: 'medium',
        })}>
        Playground sharing options:
      </div>
      <div className={hstack({ gap: 'sm', alignItems: 'baseline' })}>
        <Select
          variant="filled"
          size="xs"
          label="Link expires after"
          lh={'xs'}
          value={expires}
          onChange={c => ShareOptions.isValidExpires(c) && setExpires(c)}
          allowDeselect={false}
          checkIconPosition="right"
          w={150}
          comboboxProps={{
            offset: 2,
            withinPortal: false,
          }}
          data={ShareOptions.ExpiresValues} />
        <Stack gap={'xs'} align="flex-start">
          <Select
            variant="filled"
            size="xs"
            label="Allow Access"
            lh={'xs'}
            checkIconPosition="right"
            allowDeselect={false}
            value={access}
            onChange={c => ShareOptions.isValidAccess(c) && setAccess(c)}
            comboboxProps={{
              offset: 2,
              withinPortal: false,
            }}
            data={ShareOptions.AccessValues} />
          {access === 'pincode' && (
            <Box>
              <Group justify="space-between">
                <InputLabel fz={'xs'}>Pincode</InputLabel>
                <Group gap={'xs'}>
                  <UnstyledButton
                    className={css({
                      fontSize: 'x-small',
                      color: 'dimmed',
                      transition: 'all',
                      _hover: {
                        textDecoration: 'underline',
                        y: '-1',
                      },
                    })}
                    onClick={generateRandomPincode}>
                    generate
                  </UnstyledButton>
                  <UnstyledButton
                    disabled={pincode.length < 4}
                    className={css({
                      fontSize: 'x-small',
                      color: 'dimmed',
                      transition: 'all',
                      _hover: {
                        textDecoration: 'underline',
                        y: '-1',
                      },
                      _disabled: {
                        opacity: 0.5,
                        pointerEvents: 'none',
                      },
                    })}
                    onClick={() => copy(pincode)}>
                    {copied ? 'copied' : 'copy'}
                  </UnstyledButton>
                </Group>
              </Group>
              <PinInput
                size="xs"
                value={pincode}
                onChange={setPincode}
                gap="sm"
                error={pincode.length < 4}
                placeholder="" />
            </Box>
          )}
        </Stack>
      </div>
      <div>
        <Checkbox
          size="xs"
          checked={forkable}
          onChange={e => setForkable(e.currentTarget.checked)}
          label="Allow copying"
          description="Allow others to fork this playground"
        />
      </div>
      {shareRequest?.error && <Alert title={shareRequest.error} />}
      {!shareLink &&
        (
          <>
            {access.startsWith('github:') && (
              <HStack w={'100%'}>
                <Alert color="main" w={'100%'}>
                  <Text
                    className={css({
                      fontSize: 'xs',
                      // color: 'main.8',
                    })}>
                    <Anchor
                      underline="not-hover"
                      href="mailto:denis@davydkov.com?subject=Feature%3A%20allow%20access%20via%20GitHub"
                      className={css({
                        fontSize: 'xs',
                        color: 'text',
                      })}
                    >
                      Contact
                    </Anchor>{' '}
                    to enable this feature.
                  </Text>
                </Alert>
              </HStack>
            )}
            <Group justify="space-between" align="baseline" w={'100%'}>
              <Box>
                <PricingAnchor />
              </Box>
              <Button
                disabled={btnDisabled}
                loading={isShareInProgress}
                size="xs"
                onClick={(e) => {
                  e.stopPropagation()
                  playground.send({
                    type: 'workspace.share',
                    options: {
                      expires,
                      pincode,
                      forkable,
                      access,
                    },
                  })
                }}>
                Generate link
              </Button>
            </Group>
          </>
        )}
      {shareRequest?.success && shareLink && (
        <CopyButton value={shareLink} timeout={2000}>
          {({ copied, copy }) => (
            <Alert title="Share link" color="green" w={'100%'}>
              <Stack gap={'2xs'}>
                <Input
                  value={shareLink}
                  variant="unstyled"
                  readOnly
                  size="xs"
                  c="green"
                  px={0}
                  classNames={{
                    input: css({
                      cursor: 'pointer',
                      // borderColor: 'transparent',
                      // backgroundColor: 'transparent',
                      color: 'green',
                      fontSize: 'xs',
                      userSelect: 'all',
                    }),
                  }}
                  // rightSection={
                  //   <ActionIcon color={copied ? 'green' : 'gray'} variant={copied ? 'light' : 'subtle'} onClick={copy}>
                  //     {copied ? <IconCheck style={{ width: 14 }} /> : <IconCopy style={{ width: 14 }} />}
                  //   </ActionIcon>
                  // }
                  // rightSectionPointerEvents="auto"
                />
                <div className={hstack({ gap: 'xs', alignItems: 'baseline' })}>
                  <Button
                    onClick={copy}
                    color="green"
                    variant={copied ? 'light' : 'subtle'}
                    size="compact-xs"
                    fz="2xs"
                    px="2xs"
                    c="green"
                    fw="normal">
                    {copied ? 'Copied' : 'Copy to clipboard'}
                  </Button>
                  <Anchor fz={'2xs'} c="green" href={shareLink} target="_blank" underline="hover">
                    <div className={hstack({ gap: '1', alignItems: 'center' })}>
                      <span>Open in new tab</span>
                      <IconExternalLink size={10} />
                    </div>
                  </Anchor>
                </div>
              </Stack>
            </Alert>
          )}
        </CopyButton>
      )}
    </>
  )
}
