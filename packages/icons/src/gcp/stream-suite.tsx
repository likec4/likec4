import type { SVGProps } from 'react'
const SvgStreamSuite = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <g fill="none" fillRule="evenodd" transform="translate(2 5)">
      <path
        fill="#4285F4"
        d="M5.734 1.007H16.09l-1.132 1.611H4.565zM3.451 4.297h10.356l-1.132 1.611H2.283zM1.169 7.586h10.356l-1.133 1.612H0z"
      />
      <circle cx={10.339} cy={13.226} r={1.544} stroke="#4285F4" strokeWidth={1.611} />
      <path fill="#4285F4" d="M10.747 11.276 18.633.006l1.341.94-7.886 11.27z" />
    </g>
  </svg>
)
export default SvgStreamSuite
