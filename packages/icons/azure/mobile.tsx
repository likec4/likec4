// @ts-nocheck

import type { SVGProps } from 'react'
const SvgMobile = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={9} x2={9} y1={22.81} y2={-2.491} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.165} stopColor="#1c84dc" />
        <stop offset={0.378} stopColor="#3990e4" />
        <stop offset={0.59} stopColor="#4d99ea" />
        <stop offset={0.799} stopColor="#5a9eee" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id="b" x1={9} x2={9} y1={15.982} y2={1.522} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#d2ebff" />
        <stop offset={0.997} stopColor="#f0fffd" />
      </linearGradient>
    </defs>
    <rect width={10.777} height={18} x={3.612} fill="url(#a)" rx={0.419} />
    <rect width={2.483} height={0.333} x={7.758} y={0.604} fill="#f2f2f2" rx={0.154} />
    <rect width={8.754} height={14.461} x={4.623} y={1.522} fill="url(#b)" opacity={0.9} rx={0.201} />
    <rect width={1.204} height={1.028} x={8.398} y={16.58} fill="#f2f2f2" rx={0.286} />
    <path fill="#005ba1" d="M11.882 7.378v3.246l-2.805 1.631V9.004z" />
    <path fill="#5ea0ef" d="M11.882 7.378 9.078 9.009 6.272 7.378l2.806-1.631z" />
    <path fill="#0078d4" d="M9.077 9.009v3.246l-2.805-1.631V7.378z" />
  </svg>
)
export default SvgMobile
