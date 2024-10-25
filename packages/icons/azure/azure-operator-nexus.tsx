// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureOperatorNexus = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={12.694} x2={12.694} y1={0} y2={18} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={0.18} stopColor="#559cec" />
        <stop offset={0.47} stopColor="#3c91e5" />
        <stop offset={0.84} stopColor="#1380da" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={3.004} x2={3.004} y1={18} y2={11.59} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={7.702} x2={7.702} y1={18} y2={8.65} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={1} stopColor="#50e6ff" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M17.399 0h-9.4a.61.61 0 0 0-.612.599v7.328a4.48 4.48 0 0 1 3.949 3.677 3.695 3.695 0 0 1 2.645 3.443v.05a3.73 3.73 0 0 1-1.556 2.902h4.973a.6.6 0 0 0 .601-.599V.599a.6.6 0 0 0-.6-.599"
    />
    <g fill="#fff">
      <path d="M12.813 12.452h.744a.15.15 0 0 0 .15-.15V10.1a.15.15 0 0 0-.15-.15h-1.728a.15.15 0 0 0-.15.15v1.627c.424.173.808.419 1.134.725" />
      <rect width={2.028} height={2.523} x={8.643} y={1.871} rx={0.15} ry={0.15} />
      <rect width={2.028} height={2.523} x={11.68} y={1.871} rx={0.15} ry={0.15} />
      <path d="M11.83 8.433h1.728a.15.15 0 0 0 .15-.15V6.038a.15.15 0 0 0-.15-.15H11.83q-.011 0-.023.002a.15.15 0 0 0-.127.169v2.223c0 .083.067.15.15.15Z" />
      <rect width={2.028} height={2.523} x={14.727} y={1.871} rx={0.15} ry={0.15} />
      <path d="M16.605 5.89h-1.728q-.011 0-.023.002a.15.15 0 0 0-.127.169v2.223c0 .083.067.15.15.15h1.728a.15.15 0 0 0 .15-.15V6.039a.15.15 0 0 0-.15-.15ZM9.033 8.433h1.487a.15.15 0 0 0 .15-.15V6.038a.15.15 0 0 0-.15-.15H8.792q-.011 0-.023.002a.15.15 0 0 0-.127.169v2.188q.201.083.39.185Z" />
      <rect width={2.028} height={2.501} x={14.727} y={9.951} rx={0.15} ry={0.15} />
    </g>
    <path
      fill={`url(#b-${suffix})`}
      d="M6 14.164a1.406 1.406 0 0 0-2.796.306 1.406 1.406 0 0 0 1.552 1.24A1.4 1.4 0 0 0 6 14.164m-3.346 3.099a3.15 3.15 0 0 1-1.862-2.529 3.12 3.12 0 0 1 .84-2.495.384.384 0 0 0-.016-.544.387.387 0 0 0-.546.016 3.89 3.89 0 0 0-1.046 3.107 3.92 3.92 0 0 0 2.319 3.149.388.388 0 0 0 .51-.197.383.383 0 0 0-.198-.507Zm.609-1.326a1.81 1.81 0 0 1-.893-1.376 1.8 1.8 0 0 1 .251-1.141.387.387 0 0 0-.662-.397 2.56 2.56 0 0 0-.357 1.622A2.61 2.61 0 0 0 2.87 16.6a.39.39 0 0 0 .529-.136.385.385 0 0 0-.136-.527"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="M10.65 12.223a3.744 3.744 0 0 0-3.861-3.572 3.85 3.85 0 0 0-3.675 2.497 3.6 3.6 0 0 0-.942.247 1.03 1.03 0 0 1 .207.854 1.05 1.05 0 0 1 .857.59 2.06 2.06 0 0 1 1.368-.513c1.056 0 1.939.789 2.055 1.836a2.065 2.065 0 0 1-2.545 2.228 1.049 1.049 0 0 1-.642.911c.086.218.1.464.025.699q.111.003.224 0c.111 0 .223-.005.328-.014h6.037a.6.6 0 0 0 .159-.024 3.005 3.005 0 0 0 2.987-2.89 2.97 2.97 0 0 0-2.581-2.848Z"
    />
  </svg>
)}
export default SvgAzureOperatorNexus
