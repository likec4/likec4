// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCodeOptimization = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient
        id={`a-${suffix}`}
        x1={7.001}
        x2={7.001}
        y1={791.516}
        y2={777.516}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0.225} stopColor="#5ea0ef" />
        <stop offset={0.846} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient
        id={`c-${suffix}`}
        x1={14.514}
        x2={14.553}
        y1={781.213}
        y2={776.295}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#f2f2f2" />
        <stop offset={1} stopColor="#fff" stopOpacity={0} />
      </linearGradient>
      <linearGradient
        id={`d-${suffix}`}
        x1={2.473}
        x2={4.473}
        y1={784.494}
        y2={781.994}
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
        x1={9.152}
        x2={11.652}
        y1={781.864}
        y2={784.364}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#fff" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
      <radialGradient
        id={`b-${suffix}`}
        cx={-575.314}
        cy={906.333}
        r={1}
        gradientTransform="matrix(4.892 0 0 -4.902 2829.138 4454.883)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#86d633" />
        <stop offset={0.8} stopColor="#5e9624" />
      </radialGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M11.483 13.992c-.425-.595-.864-1.211-.957-2.064a4 4 0 0 1-.025-.495c.019-2.007 1.553-3.651 3.5-3.885V1a1 1 0 0 0-1-1H1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10.489z"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M11 11.439q-.002.218.022.434c.159 1.462 1.542 2.135 1.938 3.982a.286.286 0 0 0 .274.224h2.531a.294.294 0 0 0 .274-.224c.391-1.847 1.766-2.525 1.937-3.982A3.473 3.473 0 0 0 14.532 8h-.071A3.47 3.47 0 0 0 11 11.439"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="M15.951 9.948a.823.823 0 0 0-.794.849v.457h-1.242v-.457a.83.83 0 0 0-.811-.849h-.02a.853.853 0 0 0 0 1.705h.374v3.539a.212.212 0 1 0 .424 0v-3.538h1.271v3.538a.212.212 0 0 0 .423 0v-3.538h.374a.82.82 0 0 0 .795-.849.82.82 0 0 0-.786-.855h-.009zm-2.493 1.303h-.325a.458.458 0 0 1-.113-.908c.25-.03.403.148.433.398a.3.3 0 0 1 0 .057l.004.454h.001Zm2.52 0h-.4v-.477a.404.404 0 1 1 .8-.099.5.5 0 0 1 0 .098.434.434 0 0 1-.379.477z"
    />
    <path
      fill="#bababa"
      d="m15.228 17.934.476-.513v-1.372h-2.376v1.372l.476.513a.2.2 0 0 0 .111.066h1.174a.2.2 0 0 0 .139-.066"
    />
    <path
      fill={`url(#d-${suffix})`}
      d="m1.947 6.868.347-.346 2.731 2.739a.16.16 0 0 1 0 .222l-.347.346a.16.16 0 0 1-.222 0l-2.51-2.517a.315.315 0 0 1 0-.444z"
    />
    <path
      fill="#f2f2f2"
      d="m2.288 7.659-.346-.347a.315.315 0 0 1 0-.444l2.561-2.554a.16.16 0 0 1 .222 0l.346.347a.16.16 0 0 1 0 .222z"
    />
    <path
      fill={`url(#e-${suffix})`}
      d="m9.323 9.831-.347-.346a.157.157 0 0 1 0-.222l2.735-2.742.347.346a.313.313 0 0 1 0 .444L9.544 9.832a.157.157 0 0 1-.222 0h.001Z"
    />
    <path
      fill="#f2f2f2"
      d="m8.923 4.663.346-.347a.157.157 0 0 1 .222 0l2.561 2.554a.313.313 0 0 1 0 .444l-.346.347-2.781-2.774a.157.157 0 0 1-.005-.222l.002-.002zM7.795 3.348l-2.259 7.057a.11.11 0 0 0 .073.141l.554.177a.11.11 0 0 0 .141-.073l2.259-7.057a.11.11 0 0 0-.073-.141l-.554-.177a.11.11 0 0 0-.141.073"
    />
  </svg>
)}
export default SvgCodeOptimization
