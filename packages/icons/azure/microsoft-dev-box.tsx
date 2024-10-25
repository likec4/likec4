// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgMicrosoftDevBox = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={7.057}
        x2={7.057}
        y1={781.481}
        y2={791.514}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#32bedd" />
        <stop offset={1} stopColor="#50e6ff" />
      </linearGradient>
      <linearGradient
        id={`b-${suffix}`}
        x1={11.43}
        x2={11.43}
        y1={776.984}
        y2={785.557}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#0078d4" />
        <stop offset={0.82} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient
        id={`c-${suffix}`}
        x1={11.43}
        x2={11.43}
        y1={773.676}
        y2={776.984}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.15} stopColor="#ccc" />
        <stop offset={1} stopColor="#707070" />
      </linearGradient>
      <linearGradient
        id={`d-${suffix}`}
        x1={7.994}
        x2={10.144}
        y1={780.47}
        y2={780.47}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#5ea0ef" />
        <stop offset={0.372} stopColor="#9fc6f5" />
        <stop offset={0.8} stopColor="#e4effc" />
        <stop offset={1} stopColor="#fff" />
      </linearGradient>
      <linearGradient
        id={`e-${suffix}`}
        x1={12.719}
        x2={14.869}
        y1={780.47}
        y2={780.47}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#fff" />
        <stop offset={0.2} stopColor="#e4effc" />
        <stop offset={0.628} stopColor="#9fc6f5" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M14.113 6.871a3.16 3.16 0 0 0-2.749-3.047 4 4 0 0 0-1.273-2.757A4 4 0 0 0 7.247.002a4.1 4.1 0 0 0-3.92 2.664A3.784 3.784 0 0 0 0 6.307a3.837 3.837 0 0 0 3.973 3.69l.351-.014h6.439q.087-.001.17-.026a3.207 3.207 0 0 0 3.18-3.085Z"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M17.431 5.959H5.429A.43.43 0 0 0 5 6.388v7.716c0 .237.192.429.429.429h12.003a.43.43 0 0 0 .429-.429V6.387a.43.43 0 0 0-.429-.429Z"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="M14.009 17.125c-1.272-.2-1.322-1.115-1.322-2.593h-2.522c0 1.479-.043 2.393-1.315 2.593a.714.714 0 0 0-.636.714h6.43a.71.71 0 0 0-.636-.714Z"
    />
    <path
      fill={`url(#d-${suffix})`}
      d="m8.056 10.157.232-.231 1.824 1.829a.104.104 0 0 1 0 .148l-.232.231a.104.104 0 0 1-.148 0l-1.676-1.681a.21.21 0 0 1 .001-.296Z"
    />
    <path
      fill="#f2f2f2"
      d="m8.284 10.685-.231-.232a.21.21 0 0 1 .001-.296l1.71-1.705a.104.104 0 0 1 .148 0l.231.232a.104.104 0 0 1 0 .148z"
    />
    <path
      fill={`url(#e-${suffix})`}
      d="m12.981 12.136-.232-.231a.1.1 0 0 1-.023-.034.1.1 0 0 1-.008-.04.1.1 0 0 1 .008-.04.1.1 0 0 1 .023-.034l1.826-1.831.232.231c.039.039.061.093.062.148s-.022.109-.061.148l-1.678 1.683a.104.104 0 0 1-.148 0Z"
    />
    <path
      fill="#f2f2f2"
      d="m12.714 8.685.231-.232a.104.104 0 0 1 .148 0l1.71 1.705a.209.209 0 0 1 .001.296l-.231.232-1.857-1.852a.1.1 0 0 1-.024-.034.1.1 0 0 1-.009-.04q0-.021.008-.041a.1.1 0 0 1 .023-.035ZM12.425 7.877l-.37-.118a.075.075 0 0 0-.094.048l-1.509 4.712a.074.074 0 0 0 .048.094l.37.118a.074.074 0 0 0 .094-.049l1.509-4.712a.075.075 0 0 0-.048-.094Z"
    />
    <path fill="none" d="M0 0h18v18H0z" />
  </svg>
)}
export default SvgMicrosoftDevBox
