// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgTestBase = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={15.155} y2={2.845} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.817} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={9.044} x2={9.044} y1={12.424} y2={6.079} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={1} stopColor="#9cebff" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M17.684 11.3A3.9 3.9 0 0 0 14.3 7.548a4.92 4.92 0 0 0-5.066-4.7 5.05 5.05 0 0 0-4.825 3.285 4.656 4.656 0 0 0-4.093 4.481 4.725 4.725 0 0 0 4.89 4.541q.218 0 .431-.018h7.92a.8.8 0 0 0 .209-.032 3.95 3.95 0 0 0 3.918-3.805"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M12.076 12.466H6.012c-.193 0-.307-.309-.2-.468L7.9 8.952a.24.24 0 0 0 .042-.136V6.8a.12.12 0 0 0-.12-.12h-.108a.24.24 0 0 1-.24-.239v-.106a.24.24 0 0 1 .24-.24h2.659a.24.24 0 0 1 .24.24v.109a.24.24 0 0 1-.24.239h-.112a.12.12 0 0 0-.12.12v2.018a.24.24 0 0 0 .042.136L12.274 12c.109.157-.005.466-.198.466"
    />
    <path
      fill="#fff"
      d="M6.832 11.664 8.337 9.47a.55.55 0 0 0 .1-.311v-.884a.175.175 0 0 1 .171-.175h.854a.176.176 0 0 1 .175.175v.944a.36.36 0 0 0 .065.209l1.536 2.236a.131.131 0 0 1-.108.205H6.94a.131.131 0 0 1-.108-.205"
    />
    <g fill="#e6e6e6">
      <path d="M13.832 8.136v.452H12.57a.1.1 0 0 1-.1-.1v-.452a.1.1 0 0 1 .1-.1h1.062a.2.2 0 0 1 .2.2" />
      <path d="M13.832 8.136v.452H12.57a.1.1 0 0 1-.1-.1v-.452a.1.1 0 0 1 .1-.1h1.062a.2.2 0 0 1 .2.2" opacity={0.5} />
    </g>
    <g fill="#e6e6e6">
      <path d="M13.831 13.235v.452a.2.2 0 0 1-.2.2h-1.062a.1.1 0 0 1-.1-.1v-.452a.1.1 0 0 1 .1-.1z" />
      <path d="M13.831 13.235v.452a.2.2 0 0 1-.2.2h-1.062a.1.1 0 0 1-.1-.1v-.452a.1.1 0 0 1 .1-.1z" opacity={0.5} />
    </g>
    <path fill="#fff" d="M13.633 13.887h-.437V7.935h.437a.2.2 0 0 1 .2.2v5.553a.2.2 0 0 1-.2.199" />
    <g fill="#e6e6e6">
      <path d="M5.531 8.036v.452a.1.1 0 0 1-.1.1H4.169v-.452a.2.2 0 0 1 .2-.2h1.062a.1.1 0 0 1 .1.1" />
      <path d="M5.531 8.036v.452a.1.1 0 0 1-.1.1H4.169v-.452a.2.2 0 0 1 .2-.2h1.062a.1.1 0 0 1 .1.1" opacity={0.5} />
    </g>
    <g fill="#e6e6e6">
      <path d="M5.531 13.335v.452a.1.1 0 0 1-.1.1H4.369a.2.2 0 0 1-.2-.2v-.452h1.262a.1.1 0 0 1 .1.1" />
      <path d="M5.531 13.335v.452a.1.1 0 0 1-.1.1H4.369a.2.2 0 0 1-.2-.2v-.452h1.262a.1.1 0 0 1 .1.1" opacity={0.5} />
    </g>
    <path fill="#fff" d="M4.367 7.935H4.8v5.952h-.433a.2.2 0 0 1-.2-.2V8.134a.2.2 0 0 1 .2-.199" />
  </svg>
)}
export default SvgTestBase
