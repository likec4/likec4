// @ts-nocheck

import type { SVGProps } from 'react'
const SvgAutoScaling = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="Auto-Scaling_svg__a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#B0084D" />
        <stop offset="100%" stopColor="#FF4F8B" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#Auto-Scaling_svg__a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M48 44.402v-7.711l-7 3.89v7.672zm-16-.946 7 4.628V40.58l-7-3.89zm1.062-8.464 6.94 3.856 6.936-3.855L40 31.153zM50 34.99v10.003a1 1 0 0 1-.519.877l-9 4.95a.99.99 0 0 1-1.033-.041l-9-5.952a1 1 0 0 1-.448-.834V34.99c0-.363.197-.698.516-.875l9-4.98a1 1 0 0 1 .968 0l9 4.98c.319.177.516.512.516.875m18 4.001H57.414l5.293-5.294-1.414-1.415-7 7.003a1 1 0 0 0 0 1.414l7 7.002 1.414-1.414-5.293-5.295H68zM19.8 31.39l-1.6 1.2 4.8 6.402H12v2.001h10.586l-5.293 5.295 1.414 1.414 7-7.002a1 1 0 0 0 .093-1.307zM41 64.337l.001-10.341h-2L39 64.339l-5.247-6-1.506 1.318 6.999 8.002a1.003 1.003 0 0 0 1.506 0l7.001-8.002-1.506-1.318zm-7.247-42.692-1.506-1.317 6.999-8.002c.381-.435 1.125-.435 1.506 0l7.001 8.002-1.506 1.317L41 15.648l.001 10.34h-2L39 15.645z"
      />
    </g>
  </svg>
)
export default SvgAutoScaling
