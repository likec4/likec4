import { Box, Card, CardSection, Center, Group, Image, Text, ThemeIcon } from '@mantine/core'
import { IconLoader } from '@tabler/icons-react'
import { Handle, type NodeProps, Position, useHandleConnections, useReactFlow } from '@xyflow/react'
import clsx from 'clsx'
import { memo, useCallback } from 'react'
import { usePreviewUrl } from 'virtual:likec4/previews'
import * as css from './Nodes.css'
import type { ViewXYNode } from './types'

type ViewXYNodeProps = NodeProps<ViewXYNode>
export const ViewNode = /* @__PURE__ */ memo(function ViewNode({
  data,
  height = 320
}: ViewXYNodeProps) {
  // const out = useHandleConnections({
  //   type: 'source'
  // }).map((connection) => connection.edgeId)
  // const ine = useHandleConnections({
  //   type: 'target'
  // }).map((connection) => connection.edgeId)
  // const flow = useReactFlow()

  const titleHeight = 60
  const imageUrl = usePreviewUrl(data.viewId)

  // const edges = [...out, ...ine]

  // const onHover = useCallback(() => {
  //   for (const edgeId of edges) {
  //     flow.updateEdge(edgeId, {
  //       hidden: false,
  //       animated: true
  //     })
  //   }
  // }, edges)

  // const onLeave = useCallback(() => {
  //   for (const edgeId of edges) {
  //     flow.updateEdge(edgeId, {
  //       hidden: true
  //     })
  //   }
  // }, edges)

  return (
    <>
      <Handle type="target" position={Position.Top} className={css.handleCenter} />
      <Card
        className={clsx(
          css.viewNode,
          data.dimmed && css.dimmed
        )}
        withBorder
        shadow="xs"
        padding={0}
        // onMouseEnter={onHover}
        // onMouseLeave={onLeave}
      >
        <CardSection className={css.viewNodeImageSection}>
          {!imageUrl
            ? (
              <Center h={height - titleHeight}>
                <Group>
                  <ThemeIcon size={60} variant="transparent" color="dark">
                    <IconLoader stroke={1.5} size={'100%'} />
                  </ThemeIcon>
                  <Text size="xl" fw={500} c={'dimmed'}>
                    Preview not available
                  </Text>
                </Group>
              </Center>
            )
            : (
              <Image
                src={imageUrl}
                fit="contain"
                h={height - titleHeight}
              />
            )}
        </CardSection>
        <Box className={css.viewTitle} h={titleHeight} p={'sm'} pl={'md'}>
          <Text component="div" size="lg" fw={500}>
            {data.label}
          </Text>
        </Box>
      </Card>
      <Handle type="source" position={Position.Bottom} className={css.handleCenter} />
    </>
  )
})

// const DiagramPreview = memo<{ viewId: ViewID }>((props) => {
//   const diagram = useLikeC4View(props.viewId)
//   if (!diagram) {
//     return null
//   }
//   // const [diagram, setDiagram] =

//   // // defer rendering to avoid flickering
//   // useDebouncedEffect(
//   //   () => {
//   //     setDiagram(props.diagram)
//   //   },
//   //   [props.diagram],
//   //   clamp(ceil(Math.random() * 400, -1), {
//   //     min: 50
//   //   })
//   // )

//   return (
//     // <ShadowRoot className={css.viewNodeShadowRoot}>
//       // {diagram && (
//         <StaticLikeC4Diagram
//           background={'transparent'}
//           view={diagram}
//           keepAspectRatio={false}
//           renderIcon={RenderIcon}
//           fitView
//           fitViewPadding={0.1} />
//       // )}
//     // </ShadowRoot>
//   )
// })
