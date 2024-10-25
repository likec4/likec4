// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAzureStorageMover = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9.024} x2={8.899} y1={2.162} y2={19.749} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={-607.938}
        x2={-607.938}
        y1={-219.555}
        y2={-208.054}
        gradientTransform="matrix(1 0 0 -1 617.126 -205.758)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.001} stopColor="#a33a85" />
        <stop offset={1} stopColor="#ce74b6" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={2.017} x2={2.017} y1={0.148} y2={2.953} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
      <linearGradient id={`d-${suffix}`} x1={1.402} x2={1.402} y1={15.047} y2={17.852} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
      <linearGradient id={`e-${suffix}`} x1={16.598} x2={16.598} y1={14.597} y2={17.402} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M16.848 15.585 2.416 1.152l-.797.796L8.39 8.72l-7.384 7.33.793.799 7.388-7.333 6.865 6.865z"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M17.291 10.195a3.64 3.64 0 0 0-3.156-3.501 4.59 4.59 0 0 0-4.729-4.396 4.71 4.71 0 0 0-4.499 3.076 4.34 4.34 0 0 0-3.822 4.178 4.41 4.41 0 0 0 4.573 4.236h7.801a.6.6 0 0 0 .195 0 3.685 3.685 0 0 0 3.639-3.593Z"
    />
    <path fill={`url(#c-${suffix})`} d="M1.568 2.878a1.403 1.403 0 0 0 .9-2.656 1.404 1.404 0 0 0-.901 2.657Z" />
    <path fill={`url(#d-${suffix})`} d="M.953 17.778a1.403 1.403 0 0 0 .9-2.656 1.403 1.403 0 0 0-.9 2.656" />
    <path fill={`url(#e-${suffix})`} d="M16.148 17.328a1.403 1.403 0 0 0 .9-2.656 1.403 1.403 0 0 0-.9 2.656" />
  </svg>
)}
export default SvgAzureStorageMover
