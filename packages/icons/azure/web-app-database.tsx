// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgWebAppDatabase = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={-554.03}
        x2={-546}
        y1={1012.115}
        y2={1012.115}
        gradientTransform="matrix(1 0 0 -1 564 1025.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#005ba1" />
        <stop offset={0.3} stopColor="#0071c8" />
        <stop offset={0.5} stopColor="#0078d4" />
        <stop offset={0.8} stopColor="#006abb" />
        <stop offset={1} stopColor="#005ba1" />
      </linearGradient>
      <linearGradient
        id={`c-${suffix}`}
        x1={-561.718}
        x2={-561.736}
        y1={1019.116}
        y2={1021.424}
        gradientTransform="matrix(1 0 0 -1 564 1025.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#ccc" />
        <stop offset={1} stopColor="#fcfcfc" />
      </linearGradient>
      <linearGradient
        id={`d-${suffix}`}
        x1={-558.371}
        x2={-558.371}
        y1={1016.796}
        y2={1018.87}
        gradientTransform="matrix(1 0 0 -1 564 1025.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#ccc" />
        <stop offset={1} stopColor="#fcfcfc" />
      </linearGradient>
      <linearGradient id={`e-${suffix}`} x1={8.857} x2={8.857} y1={1.834} y2={16.187} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
      <radialGradient
        id={`b-${suffix}`}
        cx={13739.634}
        cy={-1957.723}
        r={33.137}
        gradientTransform="matrix(.15 0 0 -.15 -2055.987 -288.708)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </radialGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M13.985 10.256c-2.218 0-4.015-.626-4.015-1.453v7.742c0 .8 1.766 1.441 3.958 1.453h.057C16.2 18 18 17.372 18 16.545V8.8c0 .811-1.8 1.456-4.015 1.456"
    />
    <path
      fill="#e8e8e8"
      d="M18 8.8c0 .808-1.8 1.453-4.015 1.453S9.97 9.63 9.97 8.8s1.8-1.453 4.015-1.453S18 7.976 18 8.8"
    />
    <path
      fill="#50e6ff"
      d="M17.067 8.684c0 .513-1.385.927-3.082.927S10.9 9.2 10.9 8.684s1.384-.921 3.082-.921 3.082.413 3.082.921"
    />
    <path
      fill="#198ab3"
      d="M13.985 8.916a7.2 7.2 0 0 0-2.437.357 7.2 7.2 0 0 0 2.437.338 7 7 0 0 0 2.436-.363 7.4 7.4 0 0 0-2.436-.332"
    />
    <path fill={`url(#b-${suffix})`} d="M8.014 8.878a4.969 4.969 0 1 1-6.089-7.854l.052-.035a4.967 4.967 0 0 1 6.037 7.889" />
    <path
      fill="#fff"
      d="M3.619 3.916a7.6 7.6 0 0 1 5.207-2.092 5 5 0 0 0-.871-.841 8.4 8.4 0 0 0-2.74.643A7.3 7.3 0 0 0 2.83 3.274a1.6 1.6 0 0 1 .789.642M1.159 5.915a10.4 10.4 0 0 0-.485 1.531 5 5 0 0 0 .362.537 5 5 0 0 0 .322.38 10.4 10.4 0 0 1 .631-2.027 1.6 1.6 0 0 1-.83-.421"
      opacity={0.6}
    />
    <path
      fill="#f2f2f2"
      d="M1.732 3.262a7 7 0 0 1-.4-1.718 4.7 4.7 0 0 0-.643.847 7.4 7.4 0 0 0 .333 1.391 1.57 1.57 0 0 1 .71-.52"
      opacity={0.55}
    />
    <circle cx={2.269} cy={4.764} r={1.595} fill={`url(#c-${suffix})`} />
    <path
      fill="#f2f2f2"
      d="M4.6 7.68a1.04 1.04 0 0 1 .316-.743 7 7 0 0 1-1.484-1.086 1.6 1.6 0 0 1-.87.485 8 8 0 0 0 .847.748 7 7 0 0 0 1.2.73A1 1 0 0 1 4.6 7.68M8.277 7.8a7 7 0 0 1-1.613-.187.2.2 0 0 1 0 .065 1.02 1.02 0 0 1-.3.724 8 8 0 0 0 2 .14 4.8 4.8 0 0 0 .7-.783 7 7 0 0 1-.787.041"
      opacity={0.55}
    />
    <circle cx={5.629} cy={7.68} r={1.04} fill={`url(#d-${suffix})`} />
    <path
      fill="#f2f2f2"
      d="M6.909 4.91a1.07 1.07 0 0 1 .357-.585 15 15 0 0 1-2.607-2.419A10 10 0 0 1 3.491.2a4.3 4.3 0 0 0-.637.245A10.6 10.6 0 0 0 4.11 2.3a15.5 15.5 0 0 0 2.799 2.61"
      opacity={0.7}
    />
    <circle cx={7.996} cy={5.108} r={1.104} fill="#fff" />
    <path
      fill="#f2f2f2"
      d="m9.849 5.851-.205-.1-.175-.093h-.035l-.152-.123h-.041l-.181-.117a1.03 1.03 0 0 1-.374.538q.107.069.222.128l.047.03.2.111.5.263a5 5 0 0 0 .169-.649Z"
      opacity={0.55}
    />
    <circle cx={2.269} cy={4.764} r={1.595} fill="#fff" />
    <circle cx={5.629} cy={7.68} r={1.04} fill="#fff" />
    <path
      fill={`url(#e-${suffix})`}
      d="M9 14.986a6 6 0 0 0 .368-.012v1.2q-.183.01-.368.01a7.2 7.2 0 0 1-7.164-6.63 5.5 5.5 0 0 0 1.3.655A6 6 0 0 0 9 14.986m.548-13.152a5.6 5.6 0 0 1 .658 1.3 6.01 6.01 0 0 1 4.347 3.629 11 11 0 0 1 1.324.144 7.2 7.2 0 0 0-6.329-5.073"
    />
  </svg>
)}
export default SvgWebAppDatabase
