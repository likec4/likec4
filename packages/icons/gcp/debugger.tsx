// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgDebugger = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    baseProfile="tiny"
    overflow="visible"
    viewBox="0 0 24 24"
    {...props}
  >
    <path fill="none" d="M0 0h24v24H0z" />
    <g fillRule="evenodd">
      <path
        fill="#3367D6"
        d="M5.4 12.7h4v-1.4h-4zM4.6 20.4l6.6-6.6-.9-.9-6.6 6.6zM4 4.9l6.6 6.6.9-.9L4.9 4zM14.6 12.7h4v-1.4h-4zM12.8 13.8l6.3 6.2.9-.9-6.2-6.3zM14.5 10.5l5.8-5.9-.9-.9-5.9 5.8z"
      />
      <path fill="#5C85DE" d="M1.5 22.5H6V18H1.5zM18 22.5h4.5V18H18zM1.5 6H6V1.5H1.5zM18 6h4.5V1.5H18z" />
      <path fill="#85A4E6" d="M8.2 15.8h7.6V8.2H8.2z" />
      <path fill="#5C85DE" d="M1.5 14.2H6V9.8H1.5zM18 14.2h4.5V9.8H18z" />
    </g>
  </svg>
)}
export default SvgDebugger
