// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgEntraGlobalSecureAccess = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={0} x2={12.076} y1={9} y2={9} gradientUnits="userSpaceOnUse">
        <stop offset={0.446} stopColor="#44dbf9" />
        <stop offset={0.543} stopColor="#43d7f6" />
        <stop offset={0.622} stopColor="#40cded" />
        <stop offset={0.696} stopColor="#3cbcdf" />
        <stop offset={0.767} stopColor="#36a4cb" />
        <stop offset={0.834} stopColor="#2e84b1" />
        <stop offset={0.899} stopColor="#255f92" />
        <stop offset={0.922} stopColor="#225086" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={9} x2={9} y1={18} y2={0} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#225086" />
        <stop offset={1} stopColor="#0055c5" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={13.5} x2={13.5} y1={18} y2={0} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#225086" />
        <stop offset={0.508} stopColor="#0294e4" />
        <stop offset={1} stopColor="#6df" />
      </linearGradient>
    </defs>
    <circle cx={9} cy={9} r={9} fill={`url(#a-${suffix})`} />
    <path
      fill={`url(#b-${suffix})`}
      d="M9 0c4.971 0 9 4.029 9 9s-4.029 9-9 9-9-4.029-9-9 4.029-9 9-9m2.645 13.049H6.356c.587 2.172 1.607 3.601 2.645 3.601s2.058-1.429 2.645-3.601Zm-6.687 0h-2.45a7.68 7.68 0 0 0 3.684 3.069c-.47-.738-.858-1.661-1.143-2.714zm10.534 0h-2.45c-.291 1.2-.712 2.249-1.235 3.069a7.68 7.68 0 0 0 3.519-2.814l.167-.255ZM4.585 7.2H1.563l-.004.016a7.7 7.7 0 0 0-.209 1.785c0 .95.173 1.86.49 2.7h2.855a18.819 18.819 0 0 1-.111-4.5Zm7.472 0H5.943a17.1 17.1 0 0 0 .122 4.5h5.87a17.125 17.125 0 0 0 .122-4.5m4.38 0h-3.022a19 19 0 0 1-.111 4.5h2.855a7.694 7.694 0 0 0 .277-4.5ZM6.193 1.881l-.021.008A7.68 7.68 0 0 0 2.025 5.85h2.743c.282-1.577.774-2.95 1.424-3.969ZM9 1.349l-.104.005c-1.139.104-2.239 1.906-2.75 4.496h5.707c-.51-2.583-1.605-4.381-2.74-4.495zm2.808.532.096.157c.602 1.001 1.059 2.315 1.327 3.813h2.743a7.68 7.68 0 0 0-3.904-3.86l-.262-.109Z"
    />
    <path fill={`url(#c-${suffix})`} d="M9 0a27.85 27.85 0 0 1 0 18c4.937 0 9-4.063 9-9a9 9 0 0 0-9-9" />
  </svg>
)}
export default SvgEntraGlobalSecureAccess
