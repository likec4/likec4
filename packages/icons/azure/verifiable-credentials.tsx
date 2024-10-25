// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgVerifiableCredentials = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={5.626}
        x2={7.185}
        y1={20.16}
        y2={2.336}
        gradientTransform="matrix(1 0 0 -1 0 20)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.5} stopColor="#b796f9" />
        <stop offset={0.9} stopColor="#a67af4" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={-21.467}
        x2={-21.129}
        y1={2.275}
        y2={-1.588}
        gradientTransform="matrix(1 0 0 -1 27.6 7.804)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#a67af4" />
        <stop offset={0.241} stopColor="#9065db" />
        <stop offset={0.748} stopColor="#653eab" />
        <stop offset={1} stopColor="#552f99" />
      </linearGradient>
      <linearGradient
        id={`c-${suffix}`}
        x1={-21.32}
        x2={-21.023}
        y1={5.276}
        y2={1.887}
        gradientTransform="matrix(1 0 0 -1 27.6 7.804)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#a67af4" />
        <stop offset={0.241} stopColor="#9065db" />
        <stop offset={0.748} stopColor="#653eab" />
        <stop offset={1} stopColor="#552f99" />
      </linearGradient>
      <linearGradient
        id={`d-${suffix}`}
        x1={13.248}
        x2={13.248}
        y1={2.252}
        y2={10.977}
        gradientTransform="matrix(1 0 0 -1 0 20)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#76bc2d" />
        <stop offset={0.309} stopColor="#7ac22e" />
        <stop offset={0.718} stopColor="#84d332" />
        <stop offset={0.785} stopColor="#86d633" />
      </linearGradient>
    </defs>
    <rect width={12.099} height={17} x={0.356} y={0.252} fill={`url(#a-${suffix})`} rx={0.585} />
    <rect width={6.957} height={1.24} x={2.927} y={12.987} fill="#773adc" rx={0.306} />
    <rect width={6.957} height={1.24} x={2.927} y={10.582} fill="#773adc" rx={0.306} />
    <path
      fill={`url(#b-${suffix})`}
      d="M8.9 9.175a.52.52 0 0 0 .539-.5v-.017a.3.3 0 0 0 0-.064c-.214-1.7-1.18-3.075-3.021-3.075s-2.847 1.17-3.047 3.062a.543.543 0 0 0 .486.594Z"
    />
    <path fill="#f2f2f2" d="M6.44 5.923a1.7 1.7 0 0 1-.9-.271l.9 2.38.91-2.363a1.7 1.7 0 0 1-.91.254" />
    <circle cx={6.429} cy={4.222} r={1.701} fill={`url(#c-${suffix})`} />
    <path
      fill={`url(#d-${suffix})`}
      d="m13.684 9.152.5.323a.8.8 0 0 0 .432.127h.6a.8.8 0 0 1 .727.468l.249.544a.8.8 0 0 0 .295.34l.5.323a.8.8 0 0 1 .359.786l-.085.592a.8.8 0 0 0 .064.446l.248.544a.8.8 0 0 1-.123.855l-.391.452a.8.8 0 0 0-.187.41l-.086.592a.8.8 0 0 1-.566.653l-.573.169a.8.8 0 0 0-.379.243l-.392.452a.8.8 0 0 1-.829.244l-.574-.169a.8.8 0 0 0-.45 0l-.574.169a.8.8 0 0 1-.829-.244l-.392-.452a.8.8 0 0 0-.379-.243l-.574-.169a.8.8 0 0 1-.565-.653l-.086-.592a.8.8 0 0 0-.187-.41l-.391-.452a.8.8 0 0 1-.123-.855l.248-.544a.8.8 0 0 0 .064-.446l-.085-.592a.8.8 0 0 1 .359-.786l.5-.323a.8.8 0 0 0 .295-.34l.249-.544a.8.8 0 0 1 .727-.47h.6a.8.8 0 0 0 .432-.127l.5-.323a.8.8 0 0 1 .872.002"
    />
    <path fill="#b4ec36" d="M13.155 10.465a3 3 0 1 0 3 3 3 3 0 0 0-3-3" />
  </svg>
)}
export default SvgVerifiableCredentials
