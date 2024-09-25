// @ts-nocheck

import type { SVGProps } from 'react'
const SvgLogAnalyticsWorkspaces = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id="a" x1={5.23} x2={5.23} y1={17.45} y2={8.09} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#1988d9" />
        <stop offset={0.9} stopColor="#54aef0" />
      </linearGradient>
      <linearGradient id="b" x1={11.5} x2={11.5} y1={12.45} y2={0.55} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#198ab3" />
        <stop offset={0.01} stopColor="#198bb4" />
        <stop offset={0.44} stopColor="#27b2d7" />
        <stop offset={0.79} stopColor="#2fcbed" />
        <stop offset={1} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <path
      fill="url(#a)"
      d="M5.59 13.13h4.32v4.32H5.59Zm-4.44 4.32h3.72v-4.32H.55v3.72a.6.6 0 0 0 .6.6m-.6-5h4.32V8.09H.55Z"
    />
    <path
      fill="url(#b)"
      fillRule="evenodd"
      d="M11.5.55a5.89 5.89 0 0 1 5.95 6 5.89 5.89 0 0 1-5.95 5.95H5.55v-6A5.89 5.89 0 0 1 11.5.55"
    />
    <path fill="#fff" d="M7.59 5.65h1.36v4.08H7.59zM10.31 7.01h1.36v2.72h-1.36zM13.03 4.29h1.36v5.44h-1.36z" />
  </svg>
)
export default SvgLogAnalyticsWorkspaces
