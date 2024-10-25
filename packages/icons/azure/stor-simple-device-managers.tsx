// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgStorSimpleDeviceManagers = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={13.5} y2={0.74} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.16} stopColor="#1380da" />
        <stop offset={0.53} stopColor="#3c91e5" />
        <stop offset={0.82} stopColor="#559cec" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M18 9.5a4.06 4.06 0 0 0-3.51-3.89A5.1 5.1 0 0 0 9.24.74a5.23 5.23 0 0 0-5 3.41A4.82 4.82 0 0 0 0 8.79a4.9 4.9 0 0 0 5.07 4.71h8.65a1.5 1.5 0 0 0 .22 0 4.1 4.1 0 0 0 4.06-4"
    />
    <rect width={4.25} height={0.9} x={9.23} y={16.36} fill="#198ab3" rx={0.3} />
    <rect width={4.25} height={0.9} x={9.23} y={14.45} fill="#32bedd" rx={0.3} />
    <rect width={4.25} height={0.9} x={9.23} y={12.55} fill="#50e6ff" rx={0.3} />
    <rect width={4.25} height={0.9} x={4.95} y={7.8} fill="#f2f2f2" rx={0.3} />
    <rect width={4.25} height={0.9} x={4.95} y={9.55} fill="#f2f2f2" rx={0.3} />
    <rect width={4.25} height={0.9} x={4.95} y={11.31} fill="#f2f2f2" rx={0.3} />
  </svg>
)}
export default SvgStorSimpleDeviceManagers
