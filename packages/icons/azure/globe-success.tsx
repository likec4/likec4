// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgGlobeSuccess = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={-234.309}
        x2={-234.309}
        y1={776.485}
        y2={788.611}
        gradientTransform="scale(1 -1)rotate(-45 -1065.92 95.67)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5e9624" />
        <stop offset={0.82} stopColor="#76bc2d" />
      </linearGradient>
    </defs>
    <path
      fill="#999"
      d="M9.3 14.752c0-.154-.613-.154-.613 0a1.656 1.656 0 0 1-1.636 1.8h3.882a1.655 1.655 0 0 1-1.633-1.8"
    />
    <path
      fill="#a3a3a3"
      d="M13.335 1.1a.57.57 0 0 1 .807 0l.026.028a8.32 8.32 0 0 1-11.736 11.73.57.57 0 0 1-.049-.8l.025-.026A.57.57 0 0 1 3.19 12 7.178 7.178 0 0 0 13.312 1.882a.573.573 0 0 1 .023-.782M11.946 17.5h-5.9a.476.476 0 0 1-.476-.476.476.476 0 0 1 .476-.476h5.9a.476.476 0 0 1 .475.476.476.476 0 0 1-.475.476"
    />
    <circle cx={7.871} cy={6.563} r={6.063} fill={`url(#a-${suffix})`} />
    <path
      fill="#fff"
      d="m7.25 8.596-.557.557a.243.243 0 0 1-.343 0L4.137 6.941a.243.243 0 0 1 0-.344l.385-.385a.243.243 0 0 1 .344 0z"
    />
    <path
      fill="#f2f2f2"
      d="M6.361 9.157 5.804 8.6l5.091-5.092a.243.243 0 0 1 .344 0l.385.386a.243.243 0 0 1 0 .343l-4.92 4.92a.243.243 0 0 1-.344 0Z"
    />
  </svg>
)}
export default SvgGlobeSuccess
