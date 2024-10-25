// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgRouteTables = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={10.56} x2={10.56} y1={7.77} y2={19.24} gradientUnits="userSpaceOnUse">
        <stop offset={0.22} stopColor="#32d4f5" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={10.23} x2={11.07} y1={1.63} y2={12.04} gradientUnits="userSpaceOnUse">
        <stop offset={0.22} stopColor="#32d4f5" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M16.23 17.17A1.21 1.21 0 0 0 17.46 16v-.2c-.49-3.86-2.69-7-6.89-7s-6.48 2.66-6.91 7a1.24 1.24 0 0 0 1.1 1.36h11.47Z"
    />
    <path
      fill="#fff"
      d="M10.57 9.71a3.86 3.86 0 0 1-2.1-.61l2.08 5.42 2.06-5.39a3.83 3.83 0 0 1-2.04.58"
      opacity={0.8}
    />
    <circle cx={10.57} cy={5.84} r={3.87} fill={`url(#b-${suffix})`} />
    <path
      fill="#0078d4"
      d="M6 5.88V1a.16.16 0 0 0-.16-.17H4.57a.17.17 0 0 0-.18.17v4.71a.18.18 0 0 1-.17.17H3.1a.12.12 0 0 1-.1-.12V4.45a.11.11 0 0 0-.19-.08L.59 6.57a.16.16 0 0 0 0 .24L2.79 9A.11.11 0 0 0 3 8.93V7.61a.11.11 0 0 1 .1-.11h2.74A.17.17 0 0 0 6 7.33z"
    />
  </svg>
)}
export default SvgRouteTables
