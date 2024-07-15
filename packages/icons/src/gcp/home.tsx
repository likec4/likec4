import type { SVGProps } from 'react'
const SvgHome = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    baseProfile="tiny"
    overflow="visible"
    viewBox="0 0 24 24"
    {...props}
  >
    <path fill="none" d="M0 0h24v24H0z" />
    <g fillRule="evenodd">
      <path fill="#5C85DE" d="M13.6 4.2h-3.2L3 11v12.2h6V15h6v8.2h6V11z" />
      <path fill="#85A4E6" d="M12 4.2h-1.6L3 11v12.2h6V15h3z" />
      <path fill="#3367D6" d="M13.1 4.7 3 15.8V12l9.5-8.4z" />
      <path fill="#85A4E6" d="m12 .9-12 12 1.8 1.8L12 4.5l10.2 10.2 1.8-1.8z" />
    </g>
  </svg>
)
export default SvgHome
