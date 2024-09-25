// @ts-nocheck

import type { SVGProps } from 'react'
const SvgHeart = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={9} x2={9} y1={16.573} y2={1.427} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b31b1b" />
        <stop offset={0.82} stopColor="#e62323" />
      </linearGradient>
      <linearGradient id="b" x1={9} x2={9} y1={16.525} y2={1.427} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b31b1b" />
        <stop offset={0.82} stopColor="#e62323" />
      </linearGradient>
    </defs>
    <path
      fill="url(#a)"
      d="M9 16.573c7.7-5.518 7.96-8.737 8-9.745.048-1.409-.149-5.1-3.866-5.386A4.02 4.02 0 0 0 9 4.132a4.02 4.02 0 0 0-4.129-2.69C1.154 1.733.957 5.419 1 6.828c.035 1.008.294 4.227 8 9.745"
    />
    <path
      fill="url(#b)"
      d="M17 6.828c.048-1.409-.149-5.1-3.866-5.386A4.02 4.02 0 0 0 9 4.132a4.02 4.02 0 0 0-4.129-2.69C1.154 1.733.957 5.419 1 6.828c.035 1.008.227 4.179 7.928 9.7"
    />
  </svg>
)
export default SvgHeart
