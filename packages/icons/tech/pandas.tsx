// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgPandas = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" {...props}>
    <path
      fill="#130754"
      d="M48.697 15.176h12.25v25.437h-12.25zm0 52.251h12.25v25.436h-12.25z"
      color="#000"
      style={{
        InkscapeStroke: 'none'
      }}
    />
    <path
      fill="#ffca00"
      d="M48.697 48.037h12.25v12.001h-12.25z"
      color="#000"
      style={{
        InkscapeStroke: 'none'
      }}
    />
    <path
      fill="#130754"
      d="M29.017 36.087h12.25v84.552h-12.25zM67.97 88.414h12.25v25.436H67.97zm0-52.297h12.25v25.437H67.97z"
      color="#000"
      style={{
        InkscapeStroke: 'none'
      }}
    />
    <path
      fill="#e70488"
      d="M67.97 68.983h12.25v12.001H67.97z"
      color="#000"
      style={{
        InkscapeStroke: 'none'
      }}
    />
    <path
      fill="#130754"
      d="M87.238 8.55h12.25v84.552h-12.25z"
      color="#000"
      style={{
        InkscapeStroke: 'none'
      }}
    />
  </svg>
)}
export default SvgPandas
