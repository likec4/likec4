// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgPowershell = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 128 128" {...props}>
    <linearGradient
      id={`a-${suffix}`}
      x1={96.306}
      x2={25.454}
      y1={35.144}
      y2={98.431}
      gradientTransform="matrix(1 0 0 -1 0 128)"
      gradientUnits="userSpaceOnUse"
    >
      <stop offset={0} stopColor="#a9c8ff" />
      <stop offset={1} stopColor="#c7e6ff" />
    </linearGradient>
    <path
      fill={`url(#a-${suffix})`}
      fillRule="evenodd"
      d="M7.2 110.5c-1.7 0-3.1-.7-4.1-1.9s-1.3-2.9-.9-4.6l18.6-80.5c.8-3.4 4-6 7.4-6h92.6c1.7 0 3.1.7 4.1 1.9s1.3 2.9.9 4.6l-18.6 80.5c-.8 3.4-4 6-7.4 6z"
      clipRule="evenodd"
      opacity={0.8}
    />
    <linearGradient
      id={`b-${suffix}`}
      x1={25.336}
      x2={94.569}
      y1={98.33}
      y2={36.847}
      gradientTransform="matrix(1 0 0 -1 0 128)"
      gradientUnits="userSpaceOnUse"
    >
      <stop offset={0} stopColor="#2d4664" />
      <stop offset={0.169} stopColor="#29405b" />
      <stop offset={0.445} stopColor="#1e2f43" />
      <stop offset={0.79} stopColor="#0c131b" />
      <stop offset={1} />
    </linearGradient>
    <path
      fill={`url(#b-${suffix})`}
      fillRule="evenodd"
      d="M120.3 18.5H28.5c-2.9 0-5.7 2.3-6.4 5.2L3.7 104.3c-.7 2.9 1.1 5.2 4 5.2h91.8c2.9 0 5.7-2.3 6.4-5.2l18.4-80.5c.7-2.9-1.1-5.3-4-5.3"
      clipRule="evenodd"
    />
    <path
      fill="#2C5591"
      fillRule="evenodd"
      d="M64.2 88.3h22.3c2.6 0 4.7 2.2 4.7 4.9s-2.1 4.9-4.7 4.9H64.2c-2.6 0-4.7-2.2-4.7-4.9s2.1-4.9 4.7-4.9m14.5-21.8c-.4.8-1.2 1.6-2.6 2.6L34.6 98.9c-2.3 1.6-5.5 1-7.3-1.4-1.7-2.4-1.3-5.7.9-7.3l37.4-27.1v-.6l-23.5-25c-1.9-2-1.7-5.3.4-7.4 2.2-2 5.5-2 7.4 0l28.2 30c1.7 1.9 1.8 4.5.6 6.4"
      clipRule="evenodd"
    />
    <path
      fill="#FFF"
      fillRule="evenodd"
      d="M77.6 65.5c-.4.8-1.2 1.6-2.6 2.6L33.6 97.9c-2.3 1.6-5.5 1-7.3-1.4-1.7-2.4-1.3-5.7.9-7.3l37.4-27.1v-.6l-23.5-25c-1.9-2-1.7-5.3.4-7.4 2.2-2 5.5-2 7.4 0l28.2 30c1.7 1.8 1.8 4.4.5 6.4M63.5 87.8h22.3c2.6 0 4.7 2.1 4.7 4.6 0 2.6-2.1 4.6-4.7 4.6H63.5c-2.6 0-4.7-2.1-4.7-4.6 0-2.6 2.1-4.6 4.7-4.6"
      clipRule="evenodd"
    />
  </svg>
)}
export default SvgPowershell
