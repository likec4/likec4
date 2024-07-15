import type { SVGProps } from 'react'
const SvgManagedGrafana = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={80} height={80} {...props}>
    <defs>
      <linearGradient id="Managed-Grafana_svg__a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#B0084D" />
        <stop offset="100%" stopColor="#FF4F8B" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#Managed-Grafana_svg__a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M26 52h2V41h-2zm21 0h2V41h-2zm-7 0h2V27h-2zm-7 0h2V36h-2zm33 6.193-35.58 7.693-16.3-22.053 10.565-29.772 22.365 1.863.952 17.132a.998.998 0 0 0 1.109.938L66 32.117zm1.667-27.938a1 1 0 0 0-.777-.249L49.94 31.89l-.942-16.946a1 1 0 0 0-.915-.94l-24-2a.995.995 0 0 0-1.025.662l-11 31a1 1 0 0 0 .139.928l17 23a1 1 0 0 0 1.014.384l37-8A1 1 0 0 0 68 59V31a1 1 0 0 0-.333-.745"
      />
    </g>
  </svg>
)
export default SvgManagedGrafana
