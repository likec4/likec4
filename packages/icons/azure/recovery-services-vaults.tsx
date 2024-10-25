// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgRecoveryServicesVaults = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={11.13} x2={11.13} y1={10.95} y2={1.21} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.16} stopColor="#1380da" />
        <stop offset={0.53} stopColor="#3c91e5" />
        <stop offset={0.82} stopColor="#559cec" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={7.06} x2={7.06} y1={16.79} y2={6.78} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#198ab3" />
        <stop offset={0.13} stopColor="#21a0c7" />
        <stop offset={0.31} stopColor="#28b7db" />
        <stop offset={0.5} stopColor="#2ec7ea" />
        <stop offset={0.72} stopColor="#31d1f2" />
        <stop offset={1} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M18 7.9a3.09 3.09 0 0 0-2.68-3 3.89 3.89 0 0 0-4-3.72A4 4 0 0 0 7.5 3.81a3.68 3.68 0 0 0-3.24 3.55A3.74 3.74 0 0 0 8.13 11h6.77A3.13 3.13 0 0 0 18 7.9"
    />
    <path
      fill="#fff"
      d="m14.39 5.22-1.83-1.78c-.2-.2-.37-.13-.37.18v.8a.22.22 0 0 1-.23.22c-1.18 0-4.47.31-4.59 4.81a.23.23 0 0 0 .23.23h1.17A.23.23 0 0 0 9 9.43a2.76 2.76 0 0 1 3-3.33.23.23 0 0 1 .23.23v.74c0 .37.12.43.37.18l1.79-1.65a.23.23 0 0 0 0-.38"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M14.12 13.66a3.17 3.17 0 0 0-2.75-3.05 4 4 0 0 0-4.12-3.83 4.1 4.1 0 0 0-3.92 2.68A3.78 3.78 0 0 0 0 13.1a3.84 3.84 0 0 0 4 3.69h6.78a.5.5 0 0 0 .17 0 3.21 3.21 0 0 0 3.17-3.13"
    />
  </svg>
)}
export default SvgRecoveryServicesVaults
