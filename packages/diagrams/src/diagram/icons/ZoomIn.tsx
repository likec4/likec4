import { Path } from '../../konva'

type ZoomInIconProps = {
  fill: string
  opacity?: number
  size?: number
  x: number
  y: number
}

export const ZoomInIcon = ({ fill, opacity = 1, size = 20, x, y }: ZoomInIconProps) => {
  const originalSize = 15
  const scale = size / originalSize

  const offsetIcon = originalSize / 2

  return (
    <Path
      data='M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159ZM4.25 6.5C4.25 6.22386 4.47386 6 4.75 6H6V4.75C6 4.47386 6.22386 4.25 6.5 4.25C6.77614 4.25 7 4.47386 7 4.75V6H8.25C8.52614 6 8.75 6.22386 8.75 6.5C8.75 6.77614 8.52614 7 8.25 7H7V8.25C7 8.52614 6.77614 8.75 6.5 8.75C6.22386 8.75 6 8.52614 6 8.25V7H4.75C4.47386 7 4.25 6.77614 4.25 6.5Z'
      fill={fill}
      fillRule='evenodd'
      strokeEnabled={false}
      x={x}
      y={y}
      offsetX={offsetIcon}
      offsetY={offsetIcon}
      scaleX={scale}
      scaleY={scale}
      width={originalSize}
      height={originalSize}
      opacity={opacity}
      globalCompositeOperation={'luminosity'}
      hitStrokeWidth={5}
    />
  )
}
