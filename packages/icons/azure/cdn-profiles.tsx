// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCdnProfiles = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={10.79} x2={10.79} y1={2.17} y2={16.56} gradientUnits="userSpaceOnUse">
        <stop offset={0.18} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <rect width={1.18} height={5.26} x={3.7} y={5.49} fill="#b3b3b3" rx={0.52} transform="rotate(-90 4.29 8.12)" />
    <rect width={1.18} height={5.26} x={2.04} y={7.88} fill="#a3a3a3" rx={0.52} transform="rotate(-90 2.63 10.51)" />
    <rect width={1.18} height={5.26} x={3.7} y={10.26} fill="#7a7a7a" rx={0.52} transform="rotate(-90 4.295 12.895)" />
    <path
      fill={`url(#a-${suffix})`}
      d="M18 11a3.28 3.28 0 0 0-2.81-3.18 4.13 4.13 0 0 0-4.21-4 4.23 4.23 0 0 0-4 2.8 3.89 3.89 0 0 0-3.38 3.8 4 4 0 0 0 4.06 3.86h7.11A3.32 3.32 0 0 0 18 11"
    />
  </svg>
)}
export default SvgCdnProfiles
