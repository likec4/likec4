// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgSshKeys = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9} x2={9} y1={13.704} y2={1.277} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.817} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={8.999} x2={8.999} y1={16.723} y2={4.174} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={0.113} stopColor="#3ccce9" />
        <stop offset={0.292} stopColor="#47dbf5" />
        <stop offset={0.504} stopColor="#4ee3fd" />
        <stop offset={0.834} stopColor="#50e6ff" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M17.767 9.812a3.94 3.94 0 0 0-3.419-3.787 4.965 4.965 0 0 0-5.114-4.748A5.09 5.09 0 0 0 4.366 4.6 4.7 4.7 0 0 0 .233 9.12 4.77 4.77 0 0 0 5.17 13.7q.22 0 .435-.018H13.6a.8.8 0 0 0 .211-.032 3.987 3.987 0 0 0 3.956-3.838"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M12.5 9.127a1.446 1.446 0 0 0 0-2.041L10.017 4.6a1.437 1.437 0 0 0-2.036 0L5.5 7.086a1.446 1.446 0 0 0 0 2.041L7.565 11.2a.4.4 0 0 1 .118.286v3.85a.5.5 0 0 0 .144.348l.941.944a.325.325 0 0 0 .461 0l.913-.915V15.7l.538-.538a.19.19 0 0 0 0-.266l-.387-.389a.205.205 0 0 1 0-.29l.387-.389a.187.187 0 0 0 0-.266l-.387-.389a.205.205 0 0 1 0-.29l.388-.389a.19.19 0 0 0 0-.266l-.539-.541v-.2ZM9 5.2a.82.82 0 1 1-.817.819A.817.817 0 0 1 9 5.2"
    />
    <path
      fill="#0078d4"
      d="M8.353 15.418a.176.176 0 0 0 .3-.134v-3.116a.19.19 0 0 0-.081-.154.176.176 0 0 0-.272.154v3.116a.19.19 0 0 0 .053.134M7.23 7.916h3.642a.22.22 0 0 1 .22.22v.042a.22.22 0 0 1-.22.22H7.23a.22.22 0 0 1-.22-.22v-.041a.22.22 0 0 1 .221-.221ZM7.23 8.7h3.642a.22.22 0 0 1 .22.22v.041a.22.22 0 0 1-.221.221H7.23a.22.22 0 0 1-.22-.22v-.041a.22.22 0 0 1 .22-.221"
      opacity={0.75}
    />
  </svg>
)}
export default SvgSshKeys
