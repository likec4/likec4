// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgMissionLandingZone = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={-554.999}
        x2={-554.999}
        y1={1012.218}
        y2={1024.977}
        gradientTransform="matrix(1 0 0 -1 564 1025.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.156} stopColor="#1380da" />
        <stop offset={0.528} stopColor="#3c91e5" />
        <stop offset={0.822} stopColor="#559cec" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill="#5e9624"
      d="M17.992 12.77c-.105.675-1.083 1.057-1.639 1.26-1.7.619-14.109.429-15.535-.394q-.06-.035-.118-.071l-.064-.04a3 3 0 0 1-.16-.115A1 1 0 0 1 0 12.655v2.438c0 1.093 2.118 1.535 2.9 1.737a21 21 0 0 0 4 .554 29 29 0 0 0 8.145-.529c.889-.2 2.594-.575 2.927-1.567a1 1 0 0 0 .02-.1v-2.514a1 1 0 0 1 0 .096"
    />
    <ellipse cx={9.001} cy={12.665} fill="#76bc2d" rx={2.358} ry={8.996} transform="rotate(-89.936 9.002 12.665)" />
    <path
      fill="#f2f2f2"
      d="M11.5 14.308c-4.087.3-8.518-.188-9.9-1.1s.814-1.888 4.9-2.191 8.516.188 9.9 1.1-.816 1.888-4.9 2.191"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M18 9.3a4.04 4.04 0 0 0-3.51-3.886A5.1 5.1 0 0 0 9.242.541a5.23 5.23 0 0 0-5 3.407A4.82 4.82 0 0 0 0 8.6a4.9 4.9 0 0 0 5.068 4.7q.227 0 .446-.02h8.205a.8.8 0 0 0 .217-.032A4.09 4.09 0 0 0 18 9.3"
    />
  </svg>
)}
export default SvgMissionLandingZone
