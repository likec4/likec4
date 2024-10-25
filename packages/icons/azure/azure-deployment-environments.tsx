// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureDeploymentEnvironments = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={16.686} y2={13.377} gradientUnits="userSpaceOnUse">
        <stop offset={0.001} stopColor="#37c2b1" />
        <stop offset={1} stopColor="#3cd4c2" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={8.985}
        x2={8.985}
        y1={779.158}
        y2={791.108}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.156} stopColor="#1380da" />
        <stop offset={0.528} stopColor="#3c91e5" />
        <stop offset={0.822} stopColor="#559cec" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path fill={`url(#a-${suffix})`} d="M18 16.686H0l3.332-3.149a.58.58 0 0 1 .4-.16H14.68a.58.58 0 0 1 .438.2z" />
    <path fill="#3cd4c2" d="M0 16.686h18v.41a.584.584 0 0 1-.586.586H.586A.586.586 0 0 1 0 17.096z" />
    <path
      fill={`url(#b-${suffix})`}
      d="M17.43 8.618a3.78 3.78 0 0 0-3.29-3.64A4.772 4.772 0 0 0 9.22.408a4.91 4.91 0 0 0-4.68 3.19 4.525 4.525 0 0 0-4 4.35A4.6 4.6 0 0 0 2 11.175a4.6 4.6 0 0 0 3.321 1.233h8.309a3.84 3.84 0 0 0 3.8-3.79"
    />
    <path
      fill="#f2f2f2"
      d="M6.36 6.868 9 4.278a.295.295 0 0 1 .332-.067.3.3 0 0 1 .098.067L12 6.868a.14.14 0 0 1 .045.07.13.13 0 0 1-.063.145.13.13 0 0 1-.082.015h-1.62a.153.153 0 0 0-.14.14l-.021 5.072a.11.11 0 0 1-.11.11h-1.74a.11.11 0 0 1-.11-.11l.021-5.072a.14.14 0 0 0-.037-.096.14.14 0 0 0-.093-.044h-1.6a.13.13 0 0 1-.128-.082.13.13 0 0 1-.005-.08.14.14 0 0 1 .043-.068"
    />
  </svg>
)}
export default SvgAzureDeploymentEnvironments
