// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgIfttt = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path d="M2 47.6h10.5v32.9H2zm59.8 0h-18V58h7.5v22.4h10.5V58h7.5V47.6zm28.3 0H72.2V58h7.5v22.4h10.5V58h7.5V47.6zm28.4 0h-17.9V58h7.5v22.4h10.5V58h7.5V47.6zM40.8 58V47.6H16.9v32.9h10.5v-9h9V61h-9v-3z" />
  </svg>
)}
export default SvgIfttt
