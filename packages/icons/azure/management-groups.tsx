// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgManagementGroups = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={2.95} y2={6.34} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#c69aeb" />
        <stop offset={1} stopColor="#6f4bb2" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={8.99} x2={8.99} y1={6.76} y2={9.22} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#54aef0" />
        <stop offset={1} stopColor="#1988d9" />
      </linearGradient>
    </defs>
    <path
      fill="#949494"
      d="m13.69 11.22-1.5-3.3L9 4.2 5.79 7.91 4.28 11.2l.53.25 1.23-2.68 1.21 2.68.54-.24-1.4-3.09L9 5.1l2.6 3.03-1.42 3.08.53.25 1.23-2.67 1.21 2.68z"
    />
    <circle cx={9} cy={4.65} r={1.69} fill={`url(#a-${suffix})`} />
    <path
      fill={`url(#b-${suffix})`}
      d="M6 6.76A1.23 1.23 0 1 1 4.82 8 1.23 1.23 0 0 1 6 6.76M10.72 8a1.22 1.22 0 0 0 1.22 1.22A1.23 1.23 0 1 0 10.72 8"
    />
    <g fill="#37c2b1">
      <circle cx={4.54} cy={11.32} r={0.97} />
      <circle cx={7.52} cy={11.33} r={0.97} />
      <circle cx={10.44} cy={11.34} r={0.97} />
      <circle cx={13.42} cy={11.35} r={0.97} />
    </g>
    <path
      fill="#949494"
      d="M.5 15.22a.16.16 0 0 0 .08.14l1.15.64 2 1.14a.18.18 0 0 0 .23-.06L4.57 16a.15.15 0 0 0-.06-.22l-2.29-1.37a.16.16 0 0 1-.08-.14V3.73a.16.16 0 0 1 .08-.14l2.29-1.33A.15.15 0 0 0 4.57 2L3.92.89a.18.18 0 0 0-.23-.06L1.77 1.94l-1.19.7a.16.16 0 0 0-.08.14z"
    />
    <path
      fill="#a3a3a3"
      d="M4.57 2 3.92.89a.18.18 0 0 0-.17-.08h-.08L1.75 1.94l-1.19.7a.1.1 0 0 0-.06 0 .2.2 0 0 0 0 .08l1.64 1a.16.16 0 0 1 .08-.14l2.29-1.32A.15.15 0 0 0 4.57 2M4.57 16l-.65 1.15a.18.18 0 0 1-.17.08.12.12 0 0 1-.08 0l-1.92-1.17-1.19-.7a.1.1 0 0 1-.06 0 .2.2 0 0 1 0-.08l1.64-1a.16.16 0 0 0 .08.14l2.29 1.33a.16.16 0 0 1 .06.25"
    />
    <path
      fill="#949494"
      d="M17.5 2.78a.16.16 0 0 0-.08-.14L16.27 2l-2-1.14a.18.18 0 0 0-.23.06L13.43 2a.15.15 0 0 0 .06.22l2.29 1.33a.16.16 0 0 1 .08.14v10.58a.16.16 0 0 1-.08.14l-2.29 1.33a.15.15 0 0 0-.06.22l.65 1.15a.18.18 0 0 0 .23.06l1.92-1.11 1.19-.7a.16.16 0 0 0 .08-.14z"
    />
    <path
      fill="#a3a3a3"
      d="m13.43 16 .65 1.15a.18.18 0 0 0 .17.08h.08l1.92-1.11 1.19-.7a.1.1 0 0 0 .06 0 .2.2 0 0 0 0-.08l-1.64-1a.16.16 0 0 1-.08.14l-2.29 1.33a.15.15 0 0 0-.06.19M13.43 2l.65-1.11a.18.18 0 0 1 .17-.08.12.12 0 0 1 .08 0l1.92 1.11 1.19.7a.1.1 0 0 1 .06 0 .2.2 0 0 1 0 .08l-1.64 1a.16.16 0 0 0-.08-.14l-2.29-1.3a.16.16 0 0 1-.06-.26"
    />
  </svg>
)}
export default SvgManagementGroups
