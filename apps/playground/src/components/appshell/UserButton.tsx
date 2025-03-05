import type { SessionData } from '#worker'
import { useUserSession } from '$hooks/useUserSession'
import { Avatar, Button, Menu, MenuDropdown, MenuItem, MenuTarget } from '@mantine/core'
import { useState } from 'react'

function CurrentUser({ session }: { session: SessionData }) {
  return (
    <Menu shadow="md">
      <MenuTarget>
        <Button
          variant="subtle"
          px={'xs'}
          size="xs"
          color="gray"
          leftSection={
            <Avatar src={session.avatarUrl} size={18}>
              {session.login}
            </Avatar>
          }>
          @{session.login}
        </Button>
      </MenuTarget>
      <MenuDropdown>
        <MenuItem component="a" href={`/auth/forget-me?redirect_to=${window.location.pathname}`}>
          Logout
        </MenuItem>
      </MenuDropdown>
    </Menu>
  )
}

export function UserButton() {
  const session = useUserSession()
  const [loading, setLoading] = useState(false)
  if (session) {
    return <CurrentUser session={session} />
  }
  return (
    <Button
      loading={loading}
      variant="default"
      component="a"
      href="/auth/github"
      color="gray"
      onClick={(e) => {
        setLoading(true)
        window.sessionStorage.setItem('location-before-auth', window.location.pathname)
      }}
      size="xs">
      Login with GitHub
    </Button>
  )
}
