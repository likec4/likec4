// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgMonitorHealthModels = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={8.084} x2={8.084} y1={0} y2={15.296} gradientUnits="userSpaceOnUse">
        <stop offset={0.1} stopColor="#54aef0" />
        <stop offset={0.44} stopColor="#379ce5" />
        <stop offset={0.78} stopColor="#218ddc" />
        <stop offset={1} stopColor="#1988d9" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={13.499} x2={13.499} y1={15.184} y2={12.028} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#b1b3b3" />
        <stop offset={0.217} stopColor="#bcbebd" />
        <stop offset={0.687} stopColor="#d1d1cf" />
        <stop offset={1} stopColor="#d9d9d6" />
      </linearGradient>
      <linearGradient id={`c-${suffix}`} x1={13.499} x2={13.499} y1={18.001} y2={15.298} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#4aa647" />
        <stop offset={0.998} stopColor="#8de971" />
      </linearGradient>
      <linearGradient
        id={`d-${suffix}`}
        x1={-550.47}
        x2={-550.47}
        y1={1016.012}
        y2={1013.31}
        gradientTransform="matrix(1 0 0 -1 564 1025.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.002} stopColor="#8de971" />
        <stop offset={1} stopColor="#4aa647" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M9.599 13.729c0-.58.471-1.051 1.051-1.051h.764q.387-.34.734-.666a1.804 1.804 0 0 1 1.383-2.96c.378 0 .728.117 1.018.317 1.505-2.038 1.599-3.338 1.615-3.917.048-1.427-.143-5.145-3.947-5.44a4.05 4.05 0 0 0-4.127 2.71A4.07 4.07 0 0 0 3.914.013C.157.308-.042 4.027.005 5.453c0 1.018.305 4.27 8.084 9.843a49 49 0 0 0 1.51-1.125z"
    />
    <path
      fill="none"
      d="M16.163 5.453c.048-1.427-.143-5.145-3.947-5.44a4.05 4.05 0 0 0-4.127 2.71A4.07 4.07 0 0 0 3.914.013C.157.308-.042 4.027.005 5.453c0 1.018.228 4.223 8.017 9.796"
    />
    <path
      fill="#fff"
      d="M16.163 4.892h-3.804a.16.16 0 0 0-.124.067l-1.151 1.988a.152.152 0 0 1-.257 0L9.182 3.818a.295.295 0 0 0-.533 0L7.07 8.526a.153.153 0 0 1-.276 0l-1.35-3.129a.295.295 0 0 0-.523 0L3.076 8.716a.15.15 0 0 1-.124.076h-1.75q.393.605.856 1.16h1.598a.125.125 0 0 0 .124-.076l1.151-2.121a.152.152 0 0 1 .266 0l1.579 3.671a.296.296 0 0 0 .552 0l1.664-4.945a.142.142 0 0 1 .266 0l1.389 2.634a.286.286 0 0 0 .504 0l1.769-2.977a.15.15 0 0 1 .124-.076h3.072"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M16.348 13.129H13.83v-2.544h-.601v2.544H10.65a.6.6 0 0 0-.601.601v2.92h.601v-2.92h2.579v2.92h.601v-2.92h2.518v2.866h.601V13.73a.6.6 0 0 0-.601-.601"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="M10.35 15.298a1.351 1.351 0 1 0 0 2.702 1.351 1.351 0 0 0 0-2.702m6.299 0a1.351 1.351 0 1 0 0 2.702 1.351 1.351 0 0 0 0-2.702m-3.119 0a1.351 1.351 0 1 0 0 2.702 1.351 1.351 0 0 0 0-2.702"
    />
    <circle cx={13.53} cy={10.855} r={1.351} fill={`url(#d-${suffix})`} />
  </svg>
)}
export default SvgMonitorHealthModels
