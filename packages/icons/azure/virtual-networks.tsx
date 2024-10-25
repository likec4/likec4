// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVirtualNetworks = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={9.88}
        x2={11.52}
        y1={8.59}
        y2={10.23}
        gradientTransform="rotate(-.08 -285.464 -1454.08)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#86d633" />
        <stop offset={1} stopColor="#5e9624" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={6.18} x2={7.81} y1={8.59} y2={10.23} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#86d633" />
        <stop offset={1} stopColor="#5e9624" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={2.48} x2={4.11} y1={8.59} y2={10.23} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#86d633" />
        <stop offset={1} stopColor="#5e9624" />
      </linearGradient>
    </defs>
    <circle cx={12.74} cy={8.99} r={1.16} fill={`url(#a-${suffix})`} />
    <circle cx={9.04} cy={9} r={1.16} fill={`url(#b-${suffix})`} />
    <circle cx={5.34} cy={9} r={1.16} fill={`url(#c-${suffix})`} />
    <path
      fill="#50e6ff"
      d="m6.182 13.638-.664.665a.3.3 0 0 1-.424 0L.18 9.404a.6.6 0 0 1-.001-.848l.663-.666 5.34 5.324a.3.3 0 0 1 0 .425"
    />
    <path
      fill="#1490df"
      d="m5.418 3.708.666.664a.3.3 0 0 1 0 .424L.838 10.057l-.666-.663a.6.6 0 0 1-.001-.849L4.994 3.71a.3.3 0 0 1 .424 0"
    />
    <path
      fill="#50e6ff"
      d="m17.157 7.88.663.666a.6.6 0 0 1 0 .848l-4.915 4.9a.3.3 0 0 1-.424 0l-.664-.666a.3.3 0 0 1 0-.424z"
    />
    <path
      fill="#1490df"
      d="m17.818 9.387-.665.664-5.247-5.261a.3.3 0 0 1 0-.425l.674-.67a.3.3 0 0 1 .424 0l4.823 4.836a.6.6 0 0 1-.002.849Z"
    />
  </svg>
)}
export default SvgVirtualNetworks
