// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgTemplateSpecs = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={-40}
        x2={-40}
        y1={74.181}
        y2={59.819}
        gradientTransform="translate(49 -58)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#198ab3" />
        <stop offset={0.619} stopColor="#31d0f1" />
        <stop offset={1} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <path
      fill="#32bedd"
      d="M6.216.5H2.845a1.026 1.026 0 0 0-1.026 1.026V4.9h2.052V2.552h2.345ZM15.155.5h-3.37v2.052h2.344V4.9h2.052V1.526A1.026 1.026 0 0 0 15.155.5M14.129 13.1v2.345h-2.344V17.5h3.37a1.026 1.026 0 0 0 1.026-1.026V13.1ZM3.871 15.448V13.1H1.819v3.371A1.026 1.026 0 0 0 2.845 17.5h3.371v-2.052Z"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M3.724 16.181h10.552a.59.59 0 0 0 .586-.586V2.4a.59.59 0 0 0-.586-.586H3.724a.59.59 0 0 0-.586.586v13.2a.59.59 0 0 0 .586.581"
    />
    <path
      fill="#fff"
      d="M4.6 15.009h8.8a.294.294 0 0 0 .293-.293V3.285a.294.294 0 0 0-.293-.294H4.6a.294.294 0 0 0-.293.294v11.431a.294.294 0 0 0 .293.293"
    />
    <path
      fill="#5e9624"
      d="M6.655 13.25h4.69a.294.294 0 0 0 .293-.293v-1.319a.294.294 0 0 0-.293-.293h-4.69a.294.294 0 0 0-.293.293v1.319a.294.294 0 0 0 .293.293"
    />
    <path
      fill="#76bc2d"
      d="M6.655 9.953h4.69a.294.294 0 0 0 .293-.293V8.341a.294.294 0 0 0-.293-.294h-4.69a.294.294 0 0 0-.293.294V9.66a.294.294 0 0 0 .293.293"
    />
    <path
      fill="#86d633"
      d="M6.655 6.655h4.69a.294.294 0 0 0 .293-.293V5.043a.294.294 0 0 0-.293-.293h-4.69a.294.294 0 0 0-.293.293v1.319a.294.294 0 0 0 .293.293"
    />
    {'\u200B'}
  </svg>
)}
export default SvgTemplateSpecs
