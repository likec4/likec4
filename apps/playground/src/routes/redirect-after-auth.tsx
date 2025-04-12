import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/redirect-after-auth')({
  beforeLoad: () => {
    const locationBeforeAuth = window.sessionStorage.getItem('location-before-auth') ?? '/'
    window.location.href = new URL(locationBeforeAuth, window.location.origin).toString()
  },
})
