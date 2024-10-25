// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgReleaseNotes = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      fill="#4285f4"
      d="M12.474 5.158v2.105H5.105v12.863h12.632v-7.6h2.105v7.369A2.11 2.11 0 0 1 17.737 22H5.105A2.11 2.11 0 0 1 3 19.895V7.263c0-1.158.947-2.105 2.105-2.105zm0 10.526v2.105H7.21v-2.105zm3.158-3.158v2.106H7.21v-2.106zm0-3.158v2.106H7.21V9.368zm3.157-5.263.987 2.171 2.171.987-2.17.987-.988 2.171-.986-2.171-2.171-.987 2.17-.987zM15.632 2l.657 1.447 1.448.658-1.448.658-.657 1.448-.658-1.448-1.448-.658 1.448-.658z"
    />
  </svg>
)}
export default SvgReleaseNotes
