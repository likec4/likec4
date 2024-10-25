// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgConnectedVehiclePlatform = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={7.028} x2={7.028} y1={1.179} y2={14.227} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={0.373} stopColor="#378fe4" />
        <stop offset={0.844} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={10.348} x2={10.348} y1={14.579} y2={9.835} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.262} stopColor="#3dcdea" />
        <stop offset={0.695} stopColor="#4bdff9" />
        <stop offset={1} stopColor="#50e6ff" />
      </linearGradient>
      <linearGradient
        id={`c-${suffix}`}
        x1={56.505}
        x2={56.505}
        y1={97.131}
        y2={94.734}
        gradientTransform="rotate(-7.262 -627.755 419.807)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#ccc" />
        <stop offset={0.221} stopColor="#d8d8d8" />
        <stop offset={1} stopColor="#fff" />
      </linearGradient>
      <linearGradient id={`d-${suffix}`} x1={53.843} x2={53.843} y1={91.717} y2={89.319} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#ccc" />
        <stop offset={0.221} stopColor="#d8d8d8" />
        <stop offset={1} stopColor="#fff" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M13.443 9.147a2.96 2.96 0 0 0-2.5-2.89A3.7 3.7 0 0 0 7.2 2.633a3.76 3.76 0 0 0-3.582 2.535 3.516 3.516 0 0 0-3 3.45 3.557 3.557 0 0 0 3.612 3.5q.162 0 .319-.014h5.85a.6.6 0 0 0 .154-.024 2.98 2.98 0 0 0 2.89-2.933"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M10.282 14.574c-.871 0-1.742-.006-2.613 0-.236 0-.321-.059-.315-.32a1.357 1.357 0 0 0-1.333-1.427 1.4 1.4 0 0 0-1.387 1.412c0 .321-.028.345-.352.33a.928.928 0 0 1-.8-1.484 1.2 1.2 0 0 0 .1-.344 1.25 1.25 0 0 1 .918-1.049 6.1 6.1 0 0 0 2.005-1.029 4.4 4.4 0 0 1 2.521-.82 7.2 7.2 0 0 1 2.941.417 4.7 4.7 0 0 1 1.54.934 2.77 2.77 0 0 0 1.637.724 6 6 0 0 1 1.062.238 1.8 1.8 0 0 1 1.12 1.186.9.9 0 0 1-.736 1.218 2 2 0 0 1-.253.014c-.353 0-.353 0-.366-.358a1.427 1.427 0 0 0-1.4-1.385 1.384 1.384 0 0 0-1.343 1.428c.008.281-.091.324-.33.32-.873-.012-1.744-.004-2.616-.005"
    />
    <path
      fill="#32bedd"
      d="M5.987 15.367a1.131 1.131 0 0 1 .018-2.262 1.131 1.131 0 0 1-.018 2.262M13.486 14.236a1.1 1.1 0 0 1 1.108-1.131 1.131 1.131 0 0 1 0 2.262 1.1 1.1 0 0 1-1.108-1.131"
    />
    <path fill="#fff" d="M9.732 12.273 6.351 7.188l.689-.477 3.382 5.086z" />
    <path fill={`url(#c-${suffix})`} d="M8.91 12.186a1.177 1.177 0 1 1 1.31 1.039 1.156 1.156 0 0 1-1.31-1.039" />
    <path fill={`url(#d-${suffix})`} d="M5.585 7.152a1.177 1.177 0 1 1 1.309 1.039 1.154 1.154 0 0 1-1.309-1.039" />
  </svg>
)}
export default SvgConnectedVehiclePlatform
