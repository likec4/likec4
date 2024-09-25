// @ts-nocheck

import type { SVGProps } from 'react'
const SvgPreviewFeatures = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id="a"
        x1={4.03}
        x2={4.03}
        y1={20}
        y2={11.941}
        gradientTransform="matrix(1 0 0 -1 0 20)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#86d633" />
        <stop offset={1} stopColor="#76bc2d" />
      </linearGradient>
      <linearGradient id="b" x1={4.03} x2={4.03} y1={10.059} y2={2} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#86d633" />
        <stop offset={1} stopColor="#76bc2d" />
      </linearGradient>
      <linearGradient id="c" x1={13.97} x2={13.97} y1={10.059} y2={2} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#86d633" />
        <stop offset={1} stopColor="#76bc2d" />
      </linearGradient>
    </defs>
    <path
      fill="#5e9624"
      d="M13.971 8.059a.3.3 0 0 1-.3-.3 3.433 3.433 0 0 0-3.429-3.429.3.3 0 0 1-.3-.3.3.3 0 0 1 .3-.3A3.43 3.43 0 0 0 13.67.3a.3.3 0 0 1 .3-.3.3.3 0 0 1 .3.3 3.433 3.433 0 0 0 3.43 3.429.3.3 0 0 1 0 .6 3.43 3.43 0 0 0-3.428 3.428.3.3 0 0 1-.3.3Z"
    />
    <rect width={8.059} height={8.059} fill="url(#a)" rx={0.6} />
    <rect width={8.059} height={8.059} y={9.941} fill="url(#b)" rx={0.6} />
    <rect width={8.059} height={8.059} x={9.941} y={9.941} fill="url(#c)" rx={0.6} />
    <path
      fill="#86d633"
      d="M6.516 7.118H1.543a.6.6 0 0 1-.6-.6V1.54a.6.6 0 0 1 .6-.6h4.973a.6.6 0 0 1 .6.6v4.976a.6.6 0 0 1-.6.6Zm.6 9.339v-4.973a.6.6 0 0 0-.6-.6H1.54a.6.6 0 0 0-.6.6v4.975a.6.6 0 0 0 .6.6h4.976a.6.6 0 0 0 .6-.6Zm9.942 0v-4.973a.6.6 0 0 0-.6-.6h-4.976a.6.6 0 0 0-.6.6v4.975a.6.6 0 0 0 .6.6h4.973a.6.6 0 0 0 .605-.6v-.007Z"
    />
  </svg>
)
export default SvgPreviewFeatures
