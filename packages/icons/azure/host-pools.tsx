// @ts-nocheck

import type { SVGProps } from 'react'
const SvgHostPools = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={9} x2={9} y1={17.5} y2={0.5} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#005ba1" />
        <stop offset={0.168} stopColor="#0063ae" />
        <stop offset={0.577} stopColor="#0072ca" />
        <stop offset={0.815} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <circle cx={9} cy={9} r={8.5} fill="url(#a)" />
    <path fill="#32bedd" d="M13.046 6.635v4.709l-4.062 2.363V8.992Z" />
    <path fill="#9cebff" d="M13.046 6.635 8.99 9 4.928 6.635 8.99 4.272Z" />
    <path fill="#50e6ff" d="M8.984 9v4.709l-4.056-2.365V6.635Z" />
    <path fill="#9cebff" d="m4.928 11.344 4.056-2.352v4.715Z" />
    <path fill="#50e6ff" d="M13.046 11.344 8.984 8.992v4.715Z" />
  </svg>
)
export default SvgHostPools
