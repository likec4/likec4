import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ErrorComponent } from '../../components/ErrorComponent'
import { Header } from '../../components/view-page/Header'

export const Route = createFileRoute('/_single/story/$storyId')({
  component: StoryLayout,
  errorComponent: ErrorComponent,
})

function StoryLayout() {
  return (
    <>
      <Outlet />
      <Header />
    </>
  )
}
