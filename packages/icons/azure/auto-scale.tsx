// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAutoScale = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9.777} x2={15.063} y1={-1.321} y2={13.028} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#6bb9f2" />
        <stop offset={1} stopColor="#1b93eb" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M16.98 6.058V1.176A.176.176 0 0 0 16.8 1h-4.878a.175.175 0 0 0-.124.3l1.344 1.345.09.089a.177.177 0 0 1 0 .249L7.345 8.869a.177.177 0 0 0 0 .249l1.517 1.517a.177.177 0 0 0 .249 0L15 4.748a.176.176 0 0 1 .249 0l.089.089 1.342 1.345a.175.175 0 0 0 .3-.124"
    />
    <path
      fill="#b3b3b3"
      d="M13.394 9.377v3.573a.41.41 0 0 1-.41.411H4.826a.41.41 0 0 1-.41-.411v-7.7a.41.41 0 0 1 .41-.41h4.088a.225.225 0 0 0 .225-.225v-.859a.225.225 0 0 0-.225-.225h-5.4a.41.41 0 0 0-.41.411v10.316a.41.41 0 0 0 .41.41h10.777a.41.41 0 0 0 .411-.41V9.377a.225.225 0 0 0-.226-.225h-.857a.225.225 0 0 0-.225.225"
    />
    <path
      fill="#76bc2d"
      d="M15.697 15.97h1.03V17h-1.03zM14.647 17H13.6v-1.03h1.05Zm-2.1 0H11.5v-1.03h1.049Zm-2.1 0H9.4v-1.03h1.05Zm-2.1 0H7.3v-1.03h1.048Zm-2.1 0H5.2v-1.03h1.05Zm-2.1 0H3.1v-1.03h1.049ZM1.02 15.97h1.03V17H1.02zM2.05 14.92H1.02v-1.049h1.03Zm0-2.1H1.02v-1.05h1.03Zm0-2.1H1.02V9.672h1.03Zm0-2.1H1.02V7.572h1.03Zm0-2.1H1.02V5.473h1.03Zm0-2.1H1.02V3.373h1.03ZM1.02 1.294h1.03v1.03H1.02zM8.348 2.324H7.3v-1.03h1.048Zm-2.1 0H5.2v-1.03h1.05Zm-2.1 0H3.1v-1.03h1.049ZM16.726 14.92H15.7v-1.049h1.029Zm0-2.1H15.7v-1.05h1.029Zm0-2.1H15.7V9.672h1.029Z"
    />
  </svg>
)}
export default SvgAutoScale
