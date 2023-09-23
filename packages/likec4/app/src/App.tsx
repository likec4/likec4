import { Diagram, DiagramStateProvider, useDiagramRef } from '@likec4/diagrams'
import { Box } from '@radix-ui/themes'
import { useMeasure } from '@react-hookz/web/esm'
import { memo, useEffect } from 'react'
import Navigation from './components/Navigation'
import { useCurrentView } from './likec4'
import { $pages, $router } from './router'

const AppScreen = memo((props: { width: number; height: number }) => {
  const diagramApi = useDiagramRef()
  const diagram = useCurrentView()

  if (!diagram) return null

  console.log('AppScreen', diagram)

  return (
    <>
      <Diagram
        ref={diagramApi.ref}
        diagram={diagram}
        padding={40}
        width={props.width}
        height={props.height}
        onNodeClick={node => {
          if (node.navigateTo) {
            $pages.view.open(node.navigateTo)
          }
        }}
        onEdgeClick={edge => ({})}
      />
    </>
  )
})

export default function App() {
  const [measures, measuresRef] = useMeasure<HTMLDivElement>()

  console.log('App', measures)

  useEffect(() => {
    return $router.subscribe(() => false)
  }, [])

  return (
    <main className='grid min-h-full place-items-center bg-indigo-600 px-6 py-24 sm:py-32 lg:px-8'>
      <div className='text-center'>
        <p className='text-base font-semibold text-indigo-600'>404</p>
        <h1 className='mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl'>
          Page not found
        </h1>
        <p className='mt-6 text-base leading-7 text-gray-600'>
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <div className='mt-10 flex items-center justify-center gap-x-6'>
          <a
            href='#'
            className='rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
          >
            Go back home
          </a>
          <a href='#' className='text-sm font-semibold text-gray-900'>
            Contact support <span aria-hidden='true'>&rarr;</span>
          </a>
        </div>
      </div>
    </main>
  )
}
