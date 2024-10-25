// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAppServicePlans = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={5.57} x2={5.57} y1={17.5} y2={0.5} gradientUnits="userSpaceOnUse">
        <stop offset={0.05} stopColor="#949494" />
        <stop offset={0.36} stopColor="#979797" />
        <stop offset={0.54} stopColor="#9f9f9f" />
        <stop offset={0.69} stopColor="#adadad" />
        <stop offset={0.73} stopColor="#b3b3b3" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={10.56} x2={10.56} y1={6.02} y2={19.71} gradientUnits="userSpaceOnUse">
        <stop offset={0.18} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M10.56 16.93a.56.56 0 0 1-.57.57H1.14a.56.56 0 0 1-.56-.57V1.07A.56.56 0 0 1 1.14.5H10a.56.56 0 0 1 .57.57Z"
    />
    <path
      fill="#003067"
      d="M2 6.46a1.08 1.08 0 0 1 1.13-1.08h5a1.08 1.08 0 0 1 1.05 1.08A1.08 1.08 0 0 1 8.1 7.55h-5A1.09 1.09 0 0 1 2 6.46M2 3.24a1.09 1.09 0 0 1 1.13-1.09h5a1.08 1.08 0 0 1 1.05 1.09A1.08 1.08 0 0 1 8.1 4.32h-5A1.08 1.08 0 0 1 2 3.24"
    />
    <circle cx={3.17} cy={3.24} r={0.73} fill="#50e6ff" />
    <circle cx={3.17} cy={6.46} r={0.73} fill="#50e6ff" />
    <path
      fill={`url(#b-${suffix})`}
      d="M17.42 14.38a3.12 3.12 0 0 0-2.67-3 3.93 3.93 0 0 0-4-3.8 4 4 0 0 0-3.83 2.66 3.7 3.7 0 0 0-3.22 3.59 3.77 3.77 0 0 0 3.86 3.67h6.77a3.15 3.15 0 0 0 3.09-3.12"
    />
    <path fill="none" d="M0 0h18v18H0z" />
  </svg>
)}
export default SvgAppServicePlans
