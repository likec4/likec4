// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgStorageContainer = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={15.799} y2={5.316} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.775} stopColor="#32d4f5" />
      </linearGradient>
    </defs>
    <path fill={`url(#a-${suffix})`} d="M.544 5.316h16.912v9.918a.565.565 0 0 1-.565.565H1.109a.565.565 0 0 1-.565-.565z" />
    <path fill="#0078d4" d="M1.112 2.2h15.776a.565.565 0 0 1 .565.565v2.55H.547V2.766a.565.565 0 0 1 .565-.566" />
    <path
      fill="#f78d1e"
      d="M13.528 7.347H9.384a.23.23 0 0 1-.124-.037l-1.183-.787a.2.2 0 0 0-.123-.038H4.472a.22.22 0 0 0-.222.222v7.315a.22.22 0 0 0 .222.222h9.056a.22.22 0 0 0 .222-.222V7.569a.22.22 0 0 0-.222-.222"
    />
    <rect width={2.159} height={0.432} x={5.114} y={6.91} fill="#fff" rx={0.091} />
    <rect width={0.432} height={0.432} x={5.114} y={6.91} fill="#d15900" rx={0.062} />
    <path
      fill="#fff"
      d="M13.528 7.337H8.977a.22.22 0 0 0-.157.063l-.732.731a.22.22 0 0 1-.157.066H4.472a.22.22 0 0 0-.222.221v5.591a.22.22 0 0 0 .222.222h9.056a.22.22 0 0 0 .222-.222V7.558a.22.22 0 0 0-.222-.221"
    />
  </svg>
)}
export default SvgStorageContainer
