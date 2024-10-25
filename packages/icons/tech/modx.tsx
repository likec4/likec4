// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgModx = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path fill="#00b5de" d="m63.864 14.059-8.29 13.317 43.215 26.5 24.869-39.817z" />
    <path fill="#ff5529" d="m99.06 58.089-27.178 42.806L111.97 125.9V66.106z" className="modx-original-st2" />
    <path fill="#00decc" d="m29.483 69.911 69.306-16.035L15.622 2.1v59.794z" className="modx-original-st3" />
    <path fill="#ff9640" d="M64.136 113.67 99.06 58.088 29.21 74.532 4.342 113.669z" className="modx-original-st4" />
  </svg>
)}
export default SvgModx
