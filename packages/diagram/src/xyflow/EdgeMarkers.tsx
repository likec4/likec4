import { Box } from '@mantine/core'

export const EdgeMarkers = () => (
  <Box
    pos={'absolute'}
    top={0}
    left={0}
    w={0}
    h={0}
    style={{
      overflow: 'hidden'
    }}>
    <svg xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker
          id={`likec4-marker-vee`}
          viewBox="-4 -4 14 16"
          refX={5}
          refY={4}
          markerWidth="7"
          markerHeight="8"
          preserveAspectRatio="xMaxYMid meet"
          orient="auto-start-reverse">
          <path
            d="M0,0 L7,4 L0,8 L4,4 Z"
            stroke="context-stroke"
            fill="context-stroke"
            strokeDasharray={0}
            strokeWidth={1}
            strokeLinecap={'round'}
          />
        </marker>
        <marker
          id={`likec4-marker-arrow`}
          viewBox="-1 -1 12 10"
          refX={4}
          refY={3}
          markerWidth="8"
          markerHeight="6"
          preserveAspectRatio="xMaxYMid meet"
          orient="auto-start-reverse">
          <path
            d="M 0 0 L 8 3 L 0 6 z"
            fill="context-stroke"
            stroke="none"
            strokeWidth={0}
          />
        </marker>
        <marker
          id={`likec4-marker-diamond`}
          viewBox="-4 -4 16 14"
          refX={5}
          refY={4}
          markerWidth="10"
          markerHeight="8"
          preserveAspectRatio="xMaxYMid meet"
          orient="auto-start-reverse">
          <path
            d="M5,0 L10,4 L5,8 L0,4 Z"
            stroke="none"
            fill="context-stroke"
            strokeWidth={0}
            strokeLinecap={'round'}
          />
        </marker>
        <marker
          id={`likec4-marker-odiamond`}
          viewBox="-4 -4 16 14"
          refX={6}
          refY={4}
          markerWidth="10"
          markerHeight="8"
          preserveAspectRatio="xMaxYMid meet"
          orient="auto-start-reverse">
          <path
            d="M5,0 L10,4 L5,8 L0,4 Z"
            stroke="context-stroke"
            fill="var(--likec4-background-color)"
            strokeWidth={1.25}
            strokeLinecap={'round'}
          />
        </marker>
        <marker
          id={`likec4-marker-dot`}
          viewBox="0 0 10 10"
          refX={4}
          refY={4}
          markerWidth="6"
          markerHeight="6">
          <circle
            stroke="none"
            fill="context-stroke"
            cx={4}
            cy={4}
            r={3}
          />
        </marker>
      </defs>
    </svg>
  </Box>
)
