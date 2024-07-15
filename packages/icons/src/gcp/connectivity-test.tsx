import type { SVGProps } from 'react'
const SvgConnectivityTest = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <g fill="none" fillRule="evenodd" stroke="#4285F4" strokeWidth={2}>
      <path d="M20 4 4 13V6.717M4 21l16-9v6.283" />
    </g>
  </svg>
)
export default SvgConnectivityTest
