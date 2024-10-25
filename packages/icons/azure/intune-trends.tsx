// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgIntuneTrends = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`linear-gradient-${suffix}`} x1={9.04} x2={9.04} y1={9.54} y2={1.5} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5e9624" />
        <stop offset={0.26} stopColor="#70a828" />
        <stop offset={0.79} stopColor="#9fd732" />
        <stop offset={1} stopColor="#b4ec36" />
      </linearGradient>
      <style>{'.cls-1{fill:#0078d4}'}</style>
    </defs>
    <g id={`Layer_1-${suffix}`}>
      <g id={`Icon408_Intune_Trends-${suffix}`}>
        <rect width={2.17} height={7.32} x={6.19} y={9.18} className="cls-1" rx={0.24} />
        <rect width={2.17} height={5.12} x={9.64} y={11.38} className="cls-1" rx={0.24} />
        <rect width={2.17} height={9.45} x={13.09} y={7.05} className="cls-1" rx={0.24} />
        <rect width={2.17} height={5.12} x={2.74} y={11.38} className="cls-1" rx={0.24} />
        <path
          d="m15 5.58-1-1.06-.5-.5L10 7.53a.16.16 0 0 1-.24 0L7.64 5.45l-4 4a.16.16 0 0 1-.24 0L2.87 9a.18.18 0 0 1 0-.25l4.65-4.64a.16.16 0 0 1 .24 0l2.08 2.07 2.89-2.89-.5-.5-1.05-1a.14.14 0 0 1 .09-.24h3.85a.14.14 0 0 1 .14.14v3.79a.14.14 0 0 1-.26.1"
          fill={`url(#linear-gradient-${suffix})`}
        />
      </g>
    </g>
  </svg>
)}
export default SvgIntuneTrends
