// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgArtifactRegistry = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlSpace="preserve"
    baseProfile="tiny"
    overflow="visible"
    viewBox="0 0 24 24"
    {...props}
  >
    <path fill="none" d="M0 0h24v24H0z" />
    <path fill="#5C85DE" fillRule="evenodd" d="m6 2.4-5.2 3v13.7l5.2 3v-2.6l-3-1.7V6.7L6 5z" />
    <path fill="#3367D6" fillRule="evenodd" d="M.8 8v8.5L3 17.8V6.7z" />
    <path fill="#3367D6" fillRule="evenodd" d="M.8 8 3 7.5v-.8z" />
    <path fill="#5C85DE" fillRule="evenodd" d="M18 2.4V5l3 1.7v11.1l-3 1.7v2.6l5.2-3V5.4z" />
    <path fill="#3367D6" fillRule="evenodd" d="m21 17.8 2.2-1.3V8L21 6.7z" />
    <path fill="#3367D6" fillRule="evenodd" d="m21 7.5 2.2.5L21 6.7zM21 17.1v.7l2.2-1.3z" />
    <g fillRule="evenodd">
      <path fill="#5C85DE" d="M12 5.5 9 7.1l3 1.6 3-1.6z" />
      <path fill="#3367D6" d="m12.4 12.4 2.9-1.6V7.7l-2.9 1.6zM11.7 9.3l-3-1.6v3.1l3 1.6z" />
      <path fill="#5C85DE" d="m8.56 11.376-2.9 1.6 2.9 1.6 2.8-1.6z" />
      <path fill="#3367D6" d="m8.76 18.276 2.9-1.6v-3.2l-2.9 1.6zM8.26 15.076l-2.9-1.6v3.2l2.9 1.6z" />
      <path fill="#5C85DE" d="m15.52 11.376-2.9 1.6 2.9 1.6 2.9-1.6z" />
      <path fill="#3367D6" d="m15.82 18.276 2.9-1.6v-3.2l-2.9 1.6zM15.22 15.076l-2.9-1.6v3.2l2.9 1.6z" />
    </g>
  </svg>
)}
export default SvgArtifactRegistry
