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
    <Box ref={measuresRef} position={'fixed'} width={'100%'} height={'100%'}>
      {measures && measures.width > 0 && measures.height > 0 && (
        <DiagramStateProvider>
          <AppScreen {...measures} />
        </DiagramStateProvider>
      )}
      <Navigation />
    </Box>
  )
}
