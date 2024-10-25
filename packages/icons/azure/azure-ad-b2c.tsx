// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureAdB2C = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={7.697}
        x2={14.082}
        y1={779.148}
        y2={786.61}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#225086" />
        <stop offset={1} stopColor="#0055c5" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={9.001}
        x2={9.001}
        y1={775.935}
        y2={794.824}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#44dbf9" />
        <stop offset={1} stopColor="#cbf8ff" />
      </linearGradient>
      <linearGradient
        id={`c-${suffix}`}
        x1={6.364}
        x2={6.364}
        y1={778.143}
        y2={794.391}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#6df" />
        <stop offset={1} stopColor="#0294e4" />
      </linearGradient>
      <linearGradient
        id={`d-${suffix}`}
        x1={13.5}
        x2={13.5}
        y1={774.7}
        y2={790.761}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#041642" />
        <stop offset={1} stopColor="#041642" stopOpacity={0.25} />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="m17.647 9.926-7.5-8.46a1.55 1.55 0 0 0-2.294 0l-7.5 8.46c-.579.654-.428 1.641.323 2.111l7.499 4.688c.5.313 1.148.313 1.648 0l7.499-4.688c.751-.469.902-1.457.323-2.111Z"
    />
    <path fill={`url(#b-${suffix})`} d="m4.636 10.158.052.032 4.313 2.696 4.364-2.728h.001-.001L9.001 5.234z" />
    <path
      fill={`url(#c-${suffix})`}
      d="M10.148 1.466a1.55 1.55 0 0 0-2.294 0l-7.5 8.46c-.579.654-.428 1.641.323 2.111l3.126 1.954c.388.242 1.033.511 1.715.511.621 0 1.197-.18 1.676-.487l.002-.001L9 12.886l-4.364-2.728L9.11 5.111a3.05 3.05 0 0 1 2.302-1.026c.472 0 .917.107 1.314.292l-2.579-2.909v-.002Z"
    />
    <path
      fill={`url(#d-${suffix})`}
      fillOpacity={0.5}
      d="M9.001 16.96c.287 0 .574-.078.824-.234l7.499-4.688c.751-.469.902-1.457.323-2.111l-7.499-8.461A1.53 1.53 0 0 0 9.001.959z"
      opacity={0.5}
    />
    <path
      fill="#773adc"
      d="M17.556 15.66a.44.44 0 0 0 .44-.44 2.503 2.503 0 0 0-2.452-2.502c-1.531 0-2.322.951-2.472 2.502a.45.45 0 0 0 .39.49h4.093z"
    />
    <path
      fill="#fff"
      d="M15.544 13.038a1.35 1.35 0 0 1-.751-.22l.741 1.932.731-1.922a1.4 1.4 0 0 1-.721.21"
      opacity={0.8}
    />
    <circle cx={15.544} cy={11.657} r={1.381} fill="#773adc" />
    <path
      fill="#a67af4"
      d="M14.784 17.041a.65.65 0 0 0 .661-.64v-.1c-.26-2.052-1.431-3.733-3.673-3.733s-3.453 1.421-3.673 3.743a.65.65 0 0 0 .573.72h6.123z"
    />
    <path
      fill="#fff"
      d="M11.801 13.058a2 2 0 0 1-1.111-.33l1.101 2.932 1.101-2.872c-.33.192-.709.286-1.091.27"
      opacity={0.8}
    />
    <circle cx={11.791} cy={10.997} r={2.062} fill="#a67af4" />
  </svg>
)}
export default SvgAzureAdB2C
