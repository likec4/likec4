import type { DiagramView } from '@likec4/diagrams'
import { Diagram, useDiagramApi } from '@likec4/diagrams'
import { Box, Portal } from '@radix-ui/themes'
import { useDebouncedEffect } from '@react-hookz/web'
import { memo, useRef } from 'react'

function downloadBlob(blob: Blob, name: string) {
  // Convert your blob into a Blob URL (a special url that points to an object in the browser's memory)
  const blobUrl = URL.createObjectURL(blob)

  // Create a link element
  const link = document.createElement('a')

  link.style.display = 'none'

  // Set link's href to point to the Blob URL
  link.href = blobUrl
  link.download = name

  // Click handler that releases the object URL after the element has been clicked
  // This is required for one-off downloads of the blob content
  const clickHandler = () => {
    setTimeout(() => {
      URL.revokeObjectURL(blobUrl)
      removeEventListener('click', clickHandler)
      document.body.removeChild(link)
    }, 200)
  }

  link.addEventListener('click', clickHandler, false)

  // Append link to the body
  document.body.appendChild(link)

  // Dispatch click event on the link
  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    })
  )
}

type Props = {
  diagram: DiagramView
  onCompleted: () => void
}

const ExportDiagram = memo(({ diagram, onCompleted }: Props) => {
  const id = diagram.id
  const [ref, api] = useDiagramApi()
  const padding = 20
  const width = diagram.width + padding * 2
  const height = diagram.height + padding * 2

  const onCompletedRef = useRef(onCompleted)
  onCompletedRef.current = onCompleted

  // To avoid flickering and double rendering
  useDebouncedEffect(
    () => {
      const stage = api.stage
      if (!stage) {
        return
      }
      void stage
        .toBlob({
          pixelRatio: 2,
          mimeType: 'image/png',
          callback(blob) {
            if (blob) {
              downloadBlob(blob, `${diagram.id}.png`)
            }
            onCompletedRef.current()
          }
        })
        .catch(err => {
          onCompletedRef.current()
          // Show error after 100ms to avoid blocking the UI
          setTimeout(() => {
            window.alert(err)
          }, 100)
        })
    },
    [id, api],
    400
  )

  return (
    <Portal>
      <Box
        position={'fixed'}
        style={{
          top: 0,
          left: 0,
          width,
          height,
          transform: `translateY(${-height}px)`
        }}
      >
        <Diagram
          ref={ref}
          animate={false}
          pannable={false}
          zoomable={false}
          minZoom={1}
          maxZoom={1}
          diagram={diagram}
          padding={padding}
          width={width}
          height={height}
        />
      </Box>
    </Portal>
  )
})

export default ExportDiagram
