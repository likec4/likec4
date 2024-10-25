// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgError = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={13.145} y2={0.387} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.156} stopColor="#1380da" />
        <stop offset={0.528} stopColor="#3c91e5" />
        <stop offset={0.822} stopColor="#559cec" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={13.102} x2={13.102} y1={17.613} y2={9.07} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.175} stopColor="#32caea" />
        <stop offset={0.41} stopColor="#32d2f2" />
        <stop offset={0.775} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M18 9.149a4.045 4.045 0 0 0-3.51-3.888A5.1 5.1 0 0 0 9.24.387a5.23 5.23 0 0 0-5 3.408A4.825 4.825 0 0 0 0 8.438a4.9 4.9 0 0 0 5.068 4.707q.226-.001.447-.02h8.207a.8.8 0 0 0 .217-.032A4.093 4.093 0 0 0 18 9.149"
    />
    <path fill={`url(#b-${suffix})`} d="M10.588 14.3a2.53 2.53 0 0 0 .027 1.49 2.609 2.609 0 0 0 5-1.49l-2.5-5.225Z" />
  </svg>
)}
export default SvgError
