// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureCloudShell = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={12.805} x2={12.805} y1={15.237} y2={7.962} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.156} stopColor="#1380da" />
        <stop offset={0.528} stopColor="#3c91e5" />
        <stop offset={0.822} stopColor="#559cec" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path fill="#949494" d="M15.6 5.7H.067V2.99a.226.226 0 0 1 .226-.226H15.37a.227.227 0 0 1 .227.226z" />
    <path fill="#bfbfbf" d="M.063 5.7h15.53v9.254a.23.23 0 0 1-.231.231H.294a.23.23 0 0 1-.231-.231z" />
    <path fill="#005ba1" d="M1.135 6.5h13.37v7.57H1.135z" />
    <g fill="#fff">
      <rect width={2.837} height={0.527} x={4.576} y={10.738} rx={0.263} />
      <path d="M2.675 11.215 4.35 9.54a.17.17 0 0 0 0-.243l-1.7-1.633a.17.17 0 0 0-.244.01L2.28 7.8a.17.17 0 0 0 .01.236L3.623 9.3a.17.17 0 0 1 0 .242l-1.3 1.333a.17.17 0 0 0 0 .239l.1.1a.17.17 0 0 0 .252.001" />
    </g>
    <path
      fill={`url(#a-${suffix})`}
      d="M17.937 12.958a2.3 2.3 0 0 0-2-2.216 2.906 2.906 0 0 0-2.994-2.78A2.98 2.98 0 0 0 10.092 9.9a2.75 2.75 0 0 0-2.42 2.648 2.793 2.793 0 0 0 2.89 2.684l.255-.01H15.5a.5.5 0 0 0 .124-.019 2.333 2.333 0 0 0 2.313-2.244z"
    />
  </svg>
)}
export default SvgAzureCloudShell
