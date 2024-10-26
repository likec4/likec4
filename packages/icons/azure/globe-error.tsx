// @ts-nocheck

import type { SVGProps } from 'react'
const SvgGlobeError = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id="Globe-Error_svg__a"
        x1={-223.179}
        x2={-223.179}
        y1={749.615}
        y2={761.741}
        gradientTransform="scale(1 -1)rotate(-45 -1027.915 95.67)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#b31b1b" />
        <stop offset={0.82} stopColor="#e62323" />
      </linearGradient>
    </defs>
    <path
      fill="#999"
      d="M9.3 14.752c0-.154-.613-.154-.613 0a1.656 1.656 0 0 1-1.636 1.8h3.882a1.655 1.655 0 0 1-1.633-1.8"
    />
    <path
      fill="#a3a3a3"
      d="M13.335 1.1a.57.57 0 0 1 .807 0l.026.028a8.32 8.32 0 0 1-11.736 11.73.57.57 0 0 1-.049-.8l.025-.026A.57.57 0 0 1 3.19 12 7.178 7.178 0 0 0 13.312 1.882a.573.573 0 0 1 .023-.782M11.946 17.5h-5.9a.476.476 0 0 1-.476-.476.476.476 0 0 1 .476-.476h5.9a.476.476 0 0 1 .475.476.476.476 0 0 1-.475.476"
    />
    <circle cx={7.871} cy={6.563} r={6.063} fill="url(#Globe-Error_svg__a)" />
    <g fill="#f2f2f2">
      <path d="M8.391 8.105H7.256a.255.255 0 0 1-.265-.236l-.122-5.164a.254.254 0 0 1 .266-.246h1.377a.254.254 0 0 1 .266.246l-.122 5.164a.255.255 0 0 1-.265.236" />
      <circle cx={7.823} cy={9.647} r={0.905} />
    </g>
  </svg>
)
export default SvgGlobeError
