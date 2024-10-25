// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAngularJs = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path fill="#B3B3B3" d="M63.81 1.026 4.553 21.88l9.363 77.637 49.957 27.457 50.214-27.828 9.36-77.635z" />
    <path fill="#A6120D" d="M117.536 25.998 63.672 7.629v112.785l45.141-24.983z" />
    <path fill="#DD1B16" d="m11.201 26.329 8.026 69.434 44.444 24.651V7.627z" />
    <path
      fill="#F2F2F2"
      d="m78.499 67.67-14.827 6.934H48.044l-7.347 18.374-13.663.254 36.638-81.508zm-1.434-3.491L63.77 37.858 52.864 63.726h10.807z"
    />
    <path
      fill="#B3B3B3"
      d="m63.671 11.724.098 26.134 12.375 25.888H63.698l-.027 10.841 17.209.017 8.042 18.63 13.074.242z"
    />
  </svg>
)}
export default SvgAngularJs
