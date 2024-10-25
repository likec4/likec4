// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgGroups = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={6.7} x2={6.7} y1={7.26} y2={18.36} gradientUnits="userSpaceOnUse">
        <stop offset={0.22} stopColor="#32d4f5" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={6.42} x2={7.23} y1={1.32} y2={11.39} gradientUnits="userSpaceOnUse">
        <stop offset={0.22} stopColor="#32d4f5" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
    </defs>
    <path
      fill="#0078d4"
      d="M17.22 13.92a.79.79 0 0 0 .8-.79A.3.3 0 0 0 18 13c-.31-2.5-1.74-4.54-4.46-4.54S9.35 10.22 9.07 13a.81.81 0 0 0 .72.88h7.43Z"
    />
    <path
      fill="#fff"
      d="M13.55 9.09a2.44 2.44 0 0 1-1.36-.4l1.35 3.52 1.33-3.49a2.54 2.54 0 0 1-1.32.37"
      opacity={0.8}
    />
    <circle cx={13.55} cy={6.58} r={2.51} fill="#0078d4" />
    <path
      fill={`url(#a-${suffix})`}
      d="M12.19 16.36a1.19 1.19 0 0 0 1.19-1.19.7.7 0 0 0 0-.14c-.47-3.74-2.6-6.78-6.66-6.78S.44 10.83 0 15a1.2 1.2 0 0 0 1.07 1.31h11.1Z"
    />
    <path fill="#fff" d="M6.77 9.14a3.7 3.7 0 0 1-2-.6l2 5.25 2-5.21a3.8 3.8 0 0 1-2 .56" opacity={0.8} />
    <circle cx={6.74} cy={5.39} r={3.75} fill={`url(#b-${suffix})`} />
  </svg>
)}
export default SvgGroups
