// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVirtualClusters = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={5.35} x2={5.35} y1={7.02} y2={17.19} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b3b2b3" />
        <stop offset={0.38} stopColor="#afaeaf" />
        <stop offset={0.76} stopColor="#a2a2a2" />
        <stop offset={1} stopColor="#979797" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={11.33} x2={11.33} y1={15.74} y2={6.99} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.16} stopColor="#1380da" />
        <stop offset={0.53} stopColor="#3c91e5" />
        <stop offset={0.82} stopColor="#559cec" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill="#949494"
      d="M7.77 10.68a.39.39 0 0 1-.42.34H.92a.39.39 0 0 1-.42-.34V1.2A.39.39 0 0 1 .92.86h6.43a.39.39 0 0 1 .42.34Z"
    />
    <path
      fill="#003067"
      d="M1.57 5.2a.79.79 0 0 1 .79-.79H6a.79.79 0 0 1 .79.79A.79.79 0 0 1 6 6H2.36a.79.79 0 0 1-.79-.79ZM1.57 2.86a.79.79 0 0 1 .79-.8H6a.79.79 0 0 1 .79.8.79.79 0 0 1-.79.79H2.36a.79.79 0 0 1-.79-.79"
    />
    <circle cx={2.39} cy={2.86} r={0.53} fill="#50e6ff" />
    <circle cx={2.39} cy={5.2} r={0.53} fill="#50e6ff" />
    <path
      fill="#949494"
      d="M15.79 10.63a.39.39 0 0 1-.42.35H8.94a.39.39 0 0 1-.42-.35V1.16a.39.39 0 0 1 .42-.35h6.43a.39.39 0 0 1 .42.35Z"
    />
    <path
      fill="#003067"
      d="M9.59 5.16a.79.79 0 0 1 .79-.79H14a.79.79 0 0 1 .79.79A.79.79 0 0 1 14 6h-3.62a.79.79 0 0 1-.79-.79ZM9.59 2.81a.79.79 0 0 1 .79-.81H14a.8.8 0 0 1 .79.79.79.79 0 0 1-.79.81h-3.62a.79.79 0 0 1-.79-.79"
    />
    <circle cx={10.41} cy={2.81} r={0.53} fill="#50e6ff" />
    <circle cx={10.41} cy={5.16} r={0.53} fill="#50e6ff" />
    <path
      fill={`url(#a-${suffix})`}
      d="M9 16.84a.39.39 0 0 1-.42.35H2.14a.39.39 0 0 1-.42-.35V7.37A.39.39 0 0 1 2.14 7h6.43a.39.39 0 0 1 .43.37Z"
    />
    <path
      fill="#003067"
      d="M2.79 11.37a.79.79 0 0 1 .79-.79H7.2a.79.79 0 0 1 .79.79H8a.8.8 0 0 1-.79.79H3.58a.79.79 0 0 1-.79-.79M2.79 9a.79.79 0 0 1 .79-.79H7.2A.79.79 0 0 1 8 9a.8.8 0 0 1-.79.79H3.58A.79.79 0 0 1 2.79 9"
    />
    <circle cx={3.61} cy={9.02} r={0.53} fill="#50e6ff" />
    <circle cx={3.61} cy={11.37} r={0.53} fill="#50e6ff" />
    <path
      fill={`url(#b-${suffix})`}
      d="M17.5 13a2.77 2.77 0 0 0-2.41-2.66A3.49 3.49 0 0 0 11.5 7a3.58 3.58 0 0 0-3.43 2.33 3.31 3.31 0 0 0-2.91 3.18 3.37 3.37 0 0 0 3.48 3.23h5.93a.4.4 0 0 0 .15 0A2.8 2.8 0 0 0 17.5 13"
    />
  </svg>
)}
export default SvgVirtualClusters
