// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgLearn = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={54.259}
        x2={54.259}
        y1={17.732}
        y2={12.155}
        gradientTransform="translate(-48.199 .923)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#76bc2d" />
        <stop offset={0.192} stopColor="#7fcb30" />
        <stop offset={0.42} stopColor="#84d332" />
        <stop offset={0.775} stopColor="#86d633" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={8.267} x2={8.267} y1={14.714} y2={1.379} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#1988d9" />
        <stop offset={0.9} stopColor="#54aef0" />
      </linearGradient>
    </defs>
    <path
      fill="#005ba1"
      d="M2.881 1.393 3.93.175A.51.51 0 0 1 4.314 0h10.052a.7.7 0 0 1 .768.719v12.546a.5.5 0 0 1-.166.377l-1.132 1.031H3.561l-.695-.292Z"
    />
    <path
      fill="#fff"
      d="m3.725 1.387.642-.732A.45.45 0 0 1 4.707.5H14.1a.45.45 0 0 1 .451.452v11.93a.45.45 0 0 1-.147.334l-1 .914Z"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M7.654 12.9h-3.19a.17.17 0 0 0-.171.172V17.9a.086.086 0 0 0 .139.067l1.574-1.234a.1.1 0 0 1 .036-.015h-.006l1.79-1.4V13.07a.17.17 0 0 0-.172-.17"
    />
    <path fill="#76bc2d" d="m6.036 16.712 1.79-1.4v2.6a.086.086 0 0 1-.138.068Z" />
    <path
      fill={`url(#b-${suffix})`}
      d="M13.334 1.379H2.914a.05.05 0 0 0-.048.048v12.954a.333.333 0 0 0 .333.333h10.135a.334.334 0 0 0 .334-.333V1.712a.334.334 0 0 0-.334-.333"
    />
    <g fill="#fff">
      <path d="M6.059 6.142v3.544H5.3V7a1 1 0 0 1-.149.1 2 2 0 0 1-.182.089 2 2 0 0 1-.2.068 1.4 1.4 0 0 1-.206.04v-.635a3 3 0 0 0 .561-.223 3 3 0 0 0 .477-.3ZM8.3 9.747q-1.239 0-1.238-1.739A2.36 2.36 0 0 1 7.4 6.634a1.12 1.12 0 0 1 .97-.473q1.209 0 1.209 1.768a2.33 2.33 0 0 1-.33 1.349 1.09 1.09 0 0 1-.949.469m.034-3q-.5 0-.5 1.245 0 1.173.486 1.173t.48-1.212q0-1.209-.465-1.209ZM11.756 6.142v3.544h-.762V7a1 1 0 0 1-.149.1 2 2 0 0 1-.182.089 2 2 0 0 1-.2.068 1.4 1.4 0 0 1-.205.04v-.635a3 3 0 0 0 .561-.223 3 3 0 0 0 .476-.3Z" />
    </g>
  </svg>
)}
export default SvgLearn
