import type { SVGProps } from 'react'
const SvgOnboarding = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    baseProfile="tiny"
    overflow="visible"
    viewBox="0 0 24 24"
    {...props}
  >
    <path fill="none" d="M0 0h24v24H0z" />
    <path fill="#5C85DE" d="M21.2 9.6v7.2h2.1V8.4z" />
    <path fill="#3367D6" d="m23.3 8.4-2.1 1.2v1z" />
    <path fill="#5C85DE" d="m.4 8.4 11.5 6.3 9.3-5.1 2.1-1.2-11.4-6.2z" />
    <path fill="#85A4E6" d="m.4 8.4 11.5 6.3V2.2z" />
    <path fill="#5C85DE" d="M4.6 12.8v4.1l7.3 4 7.2-4v-4.1l-7.2 4z" />
    <path fill="#85A4E6" d="m4.6 16.9 7.3 4v-4.1l-7.3-4z" />
  </svg>
)
export default SvgOnboarding
