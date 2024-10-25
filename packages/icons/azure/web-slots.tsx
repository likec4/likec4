// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgWebSlots = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={8.929} x2={8.929} y1={7.745} y2={0.5} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#37c2b1" />
        <stop offset={0.565} stopColor="#3fddc3" />
        <stop offset={0.908} stopColor="#42e8ca" />
      </linearGradient>
    </defs>
    <path
      fill="#767676"
      d="M15.335 11.969h1.124a.18.18 0 0 1 .179.179v3.86h-1.482v-3.86a.18.18 0 0 1 .179-.179M1.542 12.066h1.172a.18.18 0 0 1 .18.18v3.763H1.362v-3.764a.18.18 0 0 1 .18-.179"
    />
    <path fill="#949494" d="M1.362 17.013v-1h15.276v1a.487.487 0 0 1-.487.487H1.846a.487.487 0 0 1-.484-.487" />
    <rect width={2.879} height={7.754} x={3.708} y={7.275} fill="#0078d4" rx={0.375} />
    <rect width={2.879} height={7.754} x={7.55} y={7.275} fill="#0078d4" rx={0.375} />
    <rect width={2.879} height={7.754} x={11.391} y={7.275} fill="#37c2b1" rx={0.375} />
    <path
      fill={`url(#a-${suffix})`}
      d="M14.1 3.52 11.129.545a.152.152 0 0 0-.259.107v1.734c-3.581 0-7.162 1.913-7.162 5.359.512-.768 3.07-2.811 7.162-2.811V6.6a.152.152 0 0 0 .259.107L14.1 3.734a.15.15 0 0 0 0-.214"
    />
  </svg>
)}
export default SvgWebSlots
