// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgNetworkManagers = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={12.141} x2={12.141} y1={7.014} y2={17.81} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={1} stopColor="#0078d4" />
      </linearGradient>
    </defs>
    <circle cx={10.475} cy={4.23} r={0.911} fill="#76bc2d" />
    <circle cx={7.567} cy={4.238} r={0.911} fill="#76bc2d" />
    <circle cx={4.66} cy={4.238} r={0.911} fill="#76bc2d" />
    <path
      fill="#50e6ff"
      d="M5.322 7.882 4.8 8.4a.235.235 0 0 1-.333 0L.605 4.554a.47.47 0 0 1 0-.666l.521-.523 4.2 4.183a.237.237 0 0 1 0 .334Z"
    />
    <path
      fill="#1490df"
      d="m4.721.08.523.52a.235.235 0 0 1 0 .333L1.122 5.068.6 4.547a.473.473 0 0 1 0-.667L4.388.08a.235.235 0 0 1 .333 0"
    />
    <path fill="#50e6ff" d="M11.494 6.355h1.159l1.813-1.808a.47.47 0 0 0 0-.666l-.522-.523-3.005 3Z" />
    <path
      fill="#1490df"
      d="m14.465 4.542-.523.521L9.82.929a.235.235 0 0 1 0-.329l.529-.527a.235.235 0 0 1 .333 0l3.789 3.8a.47.47 0 0 1 0 .667Z"
    />
    <path
      fill={`url(#a-${suffix})`}
      d="M17.539 13.124V11.9h-.162l-1.331-.413-.306-.918.666-1.439-.864-.864h-.162l-1.241.63-.828-.342-.54-1.494h-1.277v.18l-.432 1.314-.846.342-1.4-.666-.864.864.09.162.5 1.331-.288.9-1.511.485v1.314h.18l1.313.432.306.809-.666 1.44.9.917.18-.09 1.223-.629.846.342.541 1.493h1.223v-.18l.432-1.313.846-.342 1.421.665.864-.863-.09-.162-.522-1.3.342-.845Zm-5.361 1.8h-.037a2.357 2.357 0 1 1 .037 0"
    />
    {'\u200B'}
  </svg>
)}
export default SvgNetworkManagers
