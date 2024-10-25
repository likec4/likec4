// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgMachinesAzureArc = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9.23} x2={9.23} y2={18} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#a67af4" />
        <stop offset={0.999} stopColor="#773adc" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M15.074 17.39a.645.645 0 0 1-.674.61H4.062a.645.645 0 0 1-.675-.61V.61A.645.645 0 0 1 4.062 0H14.4a.645.645 0 0 1 .675.61Z"
    />
    <path
      fill="#552f99"
      d="M13.461 7.7a1.34 1.34 0 0 0-1.27-1.4H6.375a1.34 1.34 0 0 0-1.27 1.4 1.34 1.34 0 0 0 1.27 1.4h5.816a1.34 1.34 0 0 0 1.27-1.4M13.461 3.537a1.34 1.34 0 0 0-1.27-1.4H6.375a1.34 1.34 0 0 0-1.27 1.4 1.34 1.34 0 0 0 1.27 1.4h5.816a1.34 1.34 0 0 0 1.27-1.4"
    />
    <circle cx={11.826} cy={3.537} r={0.939} fill="#50e6ff" />
    <circle cx={11.826} cy={7.695} r={0.939} fill="#50e6ff" />
  </svg>
)}
export default SvgMachinesAzureArc
