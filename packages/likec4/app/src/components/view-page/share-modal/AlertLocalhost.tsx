import { Alert, rem, Text } from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'

export const AlertLocalhost = () => (
  <Alert
    color="yellow"
    icon={<IconAlertTriangle />}
    title="Localhost URL"
    styles={{ body: { gap: rem(4) } }}
  >
    <Text c={'yellow'} size="sm">
      You need to deploy your project to make it available on the internet
    </Text>
  </Alert>
)
