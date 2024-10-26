// @ts-nocheck

import type { SVGProps } from 'react'
const SvgUsers = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="Users_svg__a" x1={9} x2={9} y1={6.88} y2={20.45} gradientUnits="userSpaceOnUse">
        <stop offset={0.22} stopColor="#32d4f5" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
      <linearGradient id="Users_svg__b" x1={8.61} x2={9.6} y1={-0.4} y2={11.92} gradientUnits="userSpaceOnUse">
        <stop offset={0.22} stopColor="#32d4f5" />
        <stop offset={1} stopColor="#198ab3" />
      </linearGradient>
    </defs>
    <path
      fill="url(#Users_svg__a)"
      d="M15.72 18a1.45 1.45 0 0 0 1.45-1.45.5.5 0 0 0 0-.17C16.59 11.81 14 8.09 9 8.09s-7.66 3.15-8.17 8.3A1.46 1.46 0 0 0 2.14 18z"
    />
    <path fill="#fff" d="M9 9.17a4.6 4.6 0 0 1-2.48-.73L9 14.86l2.44-6.38A4.53 4.53 0 0 1 9 9.17" opacity={0.8} />
    <circle cx={9.01} cy={4.58} r={4.58} fill="url(#Users_svg__b)" />
  </svg>
)
export default SvgUsers
