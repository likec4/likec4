// @ts-nocheck

import type { SVGProps } from 'react'
const SvgToolbox = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={9} x2={9} y1={16.431} y2={4.559} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.156} stopColor="#1380da" />
        <stop offset={0.528} stopColor="#3c91e5" />
        <stop offset={0.822} stopColor="#559cec" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill="#a3a3a3"
      d="M13.135 4.659h-.85V2.422H5.819v2.237h-.85v-2.28a.846.846 0 0 1 .876-.81h6.414a.846.846 0 0 1 .876.81Z"
    />
    <rect width={17} height={11.872} x={0.5} y={4.559} fill="url(#a)" rx={0.567} />
    <path fill="#9cebff" d="M.5 7.594h17v1.311H.5z" />
    <path fill="#005ba1" d="M6.617 8.905H11.5v1.531a.28.28 0 0 1-.281.281H6.9a.28.28 0 0 1-.281-.281V8.905z" />
    <path fill="#83b9f9" d="M.5 10.894v2.995l4.644 1.489.871-2.716z" />
    <path fill="#5ea0ef" d="M17.5 10.745a2.718 2.718 0 1 0 0 4.837Z" />
  </svg>
)
export default SvgToolbox
