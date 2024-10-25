// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgBuilds = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={-4199.359}
        x2={-4199.359}
        y1={990.275}
        y2={982.921}
        gradientTransform="rotate(180 -2095.112 495.404)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.265} stopColor="#a67af4" />
        <stop offset={0.45} stopColor="#9e6ff0" />
        <stop offset={0.771} stopColor="#8952e5" />
        <stop offset={1} stopColor="#773adc" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={9} x2={9} y1={17.466} y2={12.672} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={0.735} stopColor="#a67af4" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M12.362 4.809 9.386 7.785a.356.356 0 0 1-.5 0L5.909 4.809a.159.159 0 0 1 .112-.271h1.83a.16.16 0 0 0 .158-.158V.661a.127.127 0 0 1 .127-.127h2a.126.126 0 0 1 .126.127V4.38a.16.16 0 0 0 .159.158h1.83a.159.159 0 0 1 .111.271"
    />
    <rect width={17} height={4.793} x={0.5} y={12.672} fill={`url(#b-${suffix})`} rx={0.513} />
    <g fill="#86d633">
      <rect width={2.488} height={2.488} x={4.174} y={9.308} rx={0.203} />
      <rect width={2.488} height={2.488} x={7.891} y={9.308} rx={0.203} />
      <rect width={2.488} height={2.488} x={11.608} y={9.308} rx={0.203} />
    </g>
    <g fill="#b4ec36">
      <rect width={2.488} height={2.488} x={6.033} y={13.746} rx={0.203} />
      <rect width={2.488} height={2.488} x={9.75} y={13.746} rx={0.203} />
    </g>
  </svg>
)}
export default SvgBuilds
