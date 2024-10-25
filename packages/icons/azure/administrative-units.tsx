// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgAdministrativeUnits = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1={9.282} x2={16.974} y1={12.079} y2={7.637} gradientUnits="userSpaceOnUse">
        <stop offset={0.384} stopColor="#005ba1" />
        <stop offset={0.829} stopColor="#0078d4" />
      </linearGradient>
      <linearGradient id={`b-${suffix}`} x1={5.573} x2={14.846} y1={12.94} y2={7.422} gradientUnits="userSpaceOnUse">
        <stop offset={0.392} stopColor="#0078d4" />
        <stop offset={0.961} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient
        id={`c-${suffix}`}
        x1={7.118}
        x2={7.118}
        y1={784.39}
        y2={775.34}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#83b9f9" />
        <stop offset={1} stopColor="#5ea0ef" />
      </linearGradient>
      <linearGradient
        id={`d-${suffix}`}
        x1={6.919}
        x2={7.502}
        y1={788.428}
        y2={781.18}
        gradientTransform="matrix(1 0 0 -1 0 791.516)"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#83b9f9" />
        <stop offset={0.9} stopColor="#5ea0ef" />
      </linearGradient>
    </defs>
    <path
      fill={`url(#a-${suffix})`}
      d="M16.235 12.663a3.93 3.93 0 0 0-2.49-3.53 2.045 2.045 0 1 0-2.295-.017c-1.483.423-2.3 1.712-2.49 3.547a.66.66 0 0 0 .587.717l6.053.032a.644.644 0 0 0 .652-.635v-.008a.2.2 0 0 0-.017-.106"
    />
    <path
      fill={`url(#b-${suffix})`}
      d="M14.524 13.255C14.275 11.247 13.3 9.54 11.5 8.966a2.485 2.485 0 1 0-2.789-.021c-1.8.514-2.8 2.081-3.025 4.31a.8.8 0 0 0 .713.872l7.355.039a.78.78 0 0 0 .792-.772v-.01a.3.3 0 0 0-.022-.129"
    />
    <path
      fill={`url(#c-${suffix})`}
      d="M11.6 15.029a.97.97 0 0 0 .97-.97.5.5 0 0 0 0-.114c-.383-3.05-2.12-5.528-5.43-5.528s-5.121 2.1-5.479 5.5a.977.977 0 0 0 .872 1.068Z"
    />
    <path
      fill="#fff"
      d="M7.185 9.142a3.04 3.04 0 0 1-1.631-.489l1.631 4.281 1.63-4.248a3.1 3.1 0 0 1-1.63.456"
      opacity={0.8}
    />
    <circle cx={7.16} cy={6.085} r={3.058} fill={`url(#d-${suffix})`} />
    <g fill="#0078d4">
      <path d="M1.715 0h2.086v.604H1.715zM17.079.604h.339v.328H18V0h-.921zM.964 17.354H.667v-.339H0V18h.964zM17.418 17.047v.307h-.339V18H18v-.953zM.667.911V.604h.297V0H0v.911zM4.839 0h2.086v.604H4.839zM7.952 0h2.086v.604H7.952zM11.075 0h2.086v.604h-2.086zM14.199 0h2.086v.604h-2.086zM1.736 17.354h2.086v.604H1.736zM4.849 17.354h2.086v.604H4.849zM7.973 17.354h2.086v.604H7.973zM11.096 17.354h2.086v.604h-2.086zM14.209 17.354h2.086v.604h-2.086zM17.396 1.641H18v2.086h-.604zM17.396 4.754H18V6.84h-.604zM17.396 7.878H18v2.086h-.604zM17.396 10.991H18v2.086h-.604zM17.396 14.114H18V16.2h-.604zM0 1.62h.604v2.086H0zM0 4.744h.604V6.83H0zM0 7.856h.604v2.086H0zM0 10.98h.604v2.086H0zM0 14.093h.604v2.086H0z" />
    </g>
  </svg>
)}
export default SvgAdministrativeUnits
