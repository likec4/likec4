// @ts-nocheck

import type { SVGProps } from 'react'
const SvgResourceGuard = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id="a"
        x1={8.997}
        x2={8.997}
        y1={774.788}
        y2={790.251}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.06} stopColor="#0a7cd7" />
        <stop offset={0.34} stopColor="#2e8ce1" />
        <stop offset={0.59} stopColor="#4897e9" />
        <stop offset={0.82} stopColor="#589eed" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill="#0078d4"
      d="M16.494 8.4c0 4.837-5.949 8.732-7.251 9.525a.45.45 0 0 1-.486 0c-1.3-.783-7.251-4.678-7.251-9.525V2.583a.466.466 0 0 1 .456-.466C6.6 2 5.528 0 9 0s2.4 2 7.038 2.117a.466.466 0 0 1 .456.466Z"
    />
    <path
      fill="url(#a)"
      d="M15.451 8.48c0 4.169-5.121 7.513-6.243 8.188a.4.4 0 0 1-.417 0c-1.121-.675-6.242-4.019-6.242-8.188V3.518a.406.406 0 0 1 .331-.47.4.4 0 0 1 .066-.006C6.935 2.972 6.022 1.265 9 1.265s2.064 1.707 6.054 1.777a.407.407 0 0 1 .4.4Z"
    />
    <path fill="#50e6ff" d="M12.38 7.016v3.932l-3.37 1.986V8.982z" />
    <path fill="#c3f1ff" d="M12.38 7.016 9.01 9.002 5.62 7.016 9.01 5.03z" />
    <path fill="#9cebff" d="M9.01 9.002v3.932l-3.39-1.986V7.016z" />
    <path fill="#c3f1ff" d="m5.62 10.948 3.39-1.966v3.952z" />
    <path fill="#9cebff" d="M12.38 10.948 9.01 8.982v3.952z" />
  </svg>
)
export default SvgResourceGuard
