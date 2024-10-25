// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgModule = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={19.049} y2={1.048} gradientUnits="userSpaceOnUse">
        <stop offset={0.2} stopColor="#0078d4" />
        <stop offset={0.287} stopColor="#1380da" />
        <stop offset={0.495} stopColor="#3c91e5" />
        <stop offset={0.659} stopColor="#559cec" />
        <stop offset={0.759} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <rect width={16} height={16} x={1} y={1} fill={`url(#a-${suffix})`} rx={0.534} />
    <g fill="#fff">
      <g opacity={0.95}>
        <rect width={3.617} height={3.368} x={2.361} y={2.777} rx={0.14} />
        <rect width={3.617} height={3.368} x={7.192} y={2.777} rx={0.14} />
        <rect width={3.617} height={3.368} x={12.023} y={2.777} rx={0.14} />
      </g>
      <rect width={8.394} height={3.368} x={2.361} y={7.28} opacity={0.45} rx={0.14} />
      <rect width={3.617} height={3.368} x={12.009} y={7.28} opacity={0.9} rx={0.14} />
      <rect width={13.186} height={3.368} x={2.361} y={11.854} opacity={0.75} rx={0.14} />
    </g>
  </svg>
)}
export default SvgModule
