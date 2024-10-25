// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgImageDefinitions = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={7.12} x2={7.12} y1={17.44} y2={0.56} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.36} stopColor="#34c1e0" />
        <stop offset={0.63} stopColor="#3ccbe8" />
        <stop offset={0.88} stopColor="#48dbf6" />
        <stop offset={1} stopColor="#50e6ff" />
      </linearGradient>
    </defs>
    <rect width={13.49} height={16.88} x={0.38} y={0.56} fill={`url(#a-${suffix})`} rx={0.56} />
    <path
      fill="#773adc"
      d="m17.58 12.38-2.87-2.87a.15.15 0 0 0-.25.1v1.68c-3.45 0-6.9 1.84-6.9 5.16.49-.74 3-2.71 6.9-2.71v1.61a.15.15 0 0 0 .25.1l2.87-2.87a.15.15 0 0 0 0-.2"
    />
    <path fill="#50e6ff" d="M11.06 5.6v4.58l-3.93 2.3V7.89z" />
    <path fill="#c3f1ff" d="M11.06 5.6 7.13 7.9 3.19 5.6l3.94-2.3z" />
    <path fill="#9cebff" d="M7.13 7.9v4.58l-3.94-2.3V5.6z" />
    <path fill="#c3f1ff" d="m3.19 10.18 3.94-2.29v4.59z" />
    <path fill="#9cebff" d="M11.06 10.18 7.13 7.89v4.59z" />
  </svg>
)}
export default SvgImageDefinitions
