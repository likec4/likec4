// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgSpatialAnchorAccounts = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={8.22} x2={8.22} y1={8.09} y2={4.71} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={1} stopColor="#b77af4" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={2.36} x2={2.36} y1={12.63} y2={9.25} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={1} stopColor="#b77af4" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={8.22} x2={8.22} y1={17.5} y2={14.12} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#773adc" />
        <stop offset={1} stopColor="#b77af4" />
      </linearGradient>
      <linearGradient id={`d-${suffix}`} x1={14.08} x2={14.08} y1={0.5} y2={11.54} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b77af4" />
        <stop offset={0.62} stopColor="#8c4fe4" />
        <stop offset={1} stopColor="#773adc" />
      </linearGradient>
    </defs>
    <circle cx={14.08} cy={10.94} r={1.34} fill="#9cebff" />
    <path
      fill="#50e6ff"
      d="M14.08 8.56a2.36 2.36 0 0 0-1.41.44L8.22 5.87l-7.14 5.07 7.14 5.42 4.53-3.44a2.4 2.4 0 0 0 1.33.4 2.38 2.38 0 1 0 0-4.76m-5.86 6.5L2.83 11l5.39-3.86L12 9.82a2.3 2.3 0 0 0-.28 1.12 2.4 2.4 0 0 0 .28 1.22Zm5.86-2.75a1.35 1.35 0 1 1 0-2.69 1.35 1.35 0 0 1 0 2.69"
    />
    <circle cx={8.22} cy={6.4} r={1.69} fill={`url(#a-${suffix})`} />
    <circle cx={2.36} cy={10.94} r={1.69} fill={`url(#b-${suffix})`} />
    <circle cx={8.22} cy={15.81} r={1.69} fill={`url(#c-${suffix})`} />
    <path
      fill={`url(#d-${suffix})`}
      d="M14.08.5A3.35 3.35 0 0 0 10.83 4c0 1.53 1.94 5.11 2.82 7.25a.46.46 0 0 0 .85 0c.89-2.16 2.83-5.77 2.83-7.25A3.4 3.4 0 0 0 14.08.5m0 4.74a1.45 1.45 0 1 1 1.44-1.44 1.44 1.44 0 0 1-1.44 1.44"
    />
  </svg>
)}
export default SvgSpatialAnchorAccounts
