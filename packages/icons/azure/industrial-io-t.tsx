// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgIndustrialIoT = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={2.053} x2={2.053} y1={3.258} y2={5.918} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={9.034} x2={9.034} y1={15.265} y2={17.924} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={15.947} x2={15.947} y1={3.34} y2={5.999} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
      <linearGradient id={`d-${suffix}`} x1={9.001} x2={9.001} y1={7.048} y2={13.068} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#50e6ff" />
        <stop offset={1} stopColor="#32bedd" />
      </linearGradient>
    </defs>
    <path
      fill="#a3a3a3"
      d="M8.622 17.233 1.77 13.277a.76.76 0 0 1-.377-.654V4.711a.76.76 0 0 1 .377-.654L8.622.1a.75.75 0 0 1 .755 0l6.852 3.956a.76.76 0 0 1 .378.654v7.912a.76.76 0 0 1-.378.654l-6.852 3.957a.76.76 0 0 1-.755 0m-5.817-4.554 5.817 3.359a.75.75 0 0 0 .755 0l5.823-3.359a.75.75 0 0 0 .377-.653V5.308a.76.76 0 0 0-.377-.654L9.377 1.3a.76.76 0 0 0-.755 0L2.805 4.654a.76.76 0 0 0-.378.654v6.718a.75.75 0 0 0 .378.653"
    />
    <circle cx={2.053} cy={4.664} r={1.33} fill={`url(#a-${suffix})`} />
    <circle cx={9.034} cy={16.67} r={1.33} fill={`url(#b-${suffix})`} />
    <circle cx={15.947} cy={4.745} r={1.33} fill={`url(#c-${suffix})`} />
    <path
      fill="#32bedd"
      d="M8.093 7.994h-2.58L5.9 4.22a.33.33 0 0 1 .329-.3h1.148a.33.33 0 0 1 .33.3ZM10.373 8.161H8.534L8.809 5.6a.236.236 0 0 1 .235-.214h.819a.237.237 0 0 1 .237.214Z"
    />
    <path
      fill={`url(#d-${suffix})`}
      d="M13.586 7.434H4.415a.385.385 0 0 0-.385.385v4.2a.385.385 0 0 0 .385.384h5.258v-1.549a.19.19 0 0 1 .189-.189h1.065a.19.19 0 0 1 .189.189V12.4h2.47a.384.384 0 0 0 .385-.384v-4.2a.385.385 0 0 0-.385-.382"
    />
    <rect width={1.524} height={1.115} x={5.505} y={8.639} fill="#fff" rx={0.138} />
    <rect width={1.524} height={1.115} x={8.239} y={8.639} fill="#fff" rx={0.138} />
    <rect width={1.524} height={1.115} x={10.972} y={8.639} fill="#fff" rx={0.138} />
    {'\u200B'}
  </svg>
)}
export default SvgIndustrialIoT
