// @ts-nocheck

import type { SVGProps } from 'react'
const SvgAzureDevTunnels = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={9.006} x2={9.006} y1={16.875} y2={-3.164} gradientUnits="userSpaceOnUse">
        <stop offset={0.033} stopColor="#0078d4" />
        <stop offset={0.627} stopColor="#03497f" />
      </linearGradient>
      <linearGradient id="b" x1={9} x2={9} y1={17.793} y2={12.657} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
    </defs>
    <path fill="url(#a)" d="M9.006 0a7.88 7.88 0 0 1 7.875 7.875v9H1.131v-9A7.88 7.88 0 0 1 9.006 0" />
    <path fill="#fff" d="M5.625 12.375v-4.5C5.625 6.014 7.139 4.5 9 4.5s3.375 1.514 3.375 3.375v4.5z" />
    <path fill="url(#b)" d="M5.625 12.375 0 18h18l-5.625-5.625z" />
  </svg>
)
export default SvgAzureDevTunnels
