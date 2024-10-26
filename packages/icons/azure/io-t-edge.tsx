// @ts-nocheck

import type { SVGProps } from 'react'
const SvgIoTEdge = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="IoT-Edge_svg__a" x1={9} x2={9} y1={12.85} y2={0.09} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#198ab3" />
        <stop offset={0.44} stopColor="#28b7db" />
        <stop offset={0.78} stopColor="#32d4f5" />
      </linearGradient>
      <linearGradient id="IoT-Edge_svg__b" x1={8.97} x2={8.97} y1={17.91} y2={14.13} href="#IoT-Edge_svg__a" />
    </defs>
    <path
      fill="url(#IoT-Edge_svg__a)"
      d="M18 8.85A4.06 4.06 0 0 0 14.49 5 5.1 5.1 0 0 0 9.24.09a5.23 5.23 0 0 0-5 3.41A4.82 4.82 0 0 0 0 8.14a4.9 4.9 0 0 0 5.07 4.71h8.65a.8.8 0 0 0 .22 0 4.09 4.09 0 0 0 4.06-4"
    />
    <path fill="#b3b3b3" d="M8.58 8.46h.78v6.19h-.78z" />
    <circle cx={8.97} cy={6.59} r={2.08} fill="#f2f2f2" />
    <rect width={3.78} height={3.78} x={7.08} y={14.13} fill="url(#IoT-Edge_svg__b)" rx={0.73} />
  </svg>
)
export default SvgIoTEdge
