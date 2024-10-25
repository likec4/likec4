// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgMachineLearning = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={1.1}
        x2={11.12}
        y1={169}
        y2={169}
        gradientTransform="translate(0 -160)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#50c7e8" />
        <stop offset={0.25} stopColor="#4cc3e4" />
        <stop offset={0.51} stopColor="#41b6da" />
        <stop offset={0.77} stopColor="#2fa2c8" />
        <stop offset={1} stopColor="#1989b2" />
      </linearGradient>
    </defs>
    <path fill="#198ab3" d="M15.8 17.5H2.2l-1.1-4.1h15.8Z" />
    <path fill={`url(#a-${suffix})`} d="M6.9.5v6.4l-5.8 6.5 1.1 4.1 8.9-10.6V.5z" />
    <path fill="#32bedd" d="m15.8 17.5-6.2-6.4 2.6-3 4.7 5.3Z" />
  </svg>
)}
export default SvgMachineLearning
