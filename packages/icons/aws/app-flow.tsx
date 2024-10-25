// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAppFlow = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#B0084D" />
        <stop offset="100%" stopColor="#FF4F8B" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill={`url(#a-${suffix})`} d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M41.657 19 25.963 45.387l-1.038-3.872-1.931.518 1.954 7.294 7.294-1.955-.517-1.931-4.125 1.104 15.194-25.544h15.015L65.315 34l-7.506 13h-7.846v2.001h9L67.624 34l-8.661-15zm4.884 13.628.518 1.932 4.173-1.119-14.417 25.56h-15L14.309 46l7.506-13h6.149v-1.999h-7.303L12 46l8.661 15h17.322l14.854-26.331 1.022 3.816 1.932-.518-1.955-7.293z"
      />
    </g>
  </svg>
)}
export default SvgAppFlow
