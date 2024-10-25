// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCloudFormation = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id={`a-${suffix}`} x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#B0084D" />
        <stop offset="100%" stopColor="#FF4F8B" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill={`url(#a-${suffix})`} d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M53 39.963h5V37.96h-5zM28 51.982h5v-2.003h-5zm-10 0h7v-2.003h-7zm0-6.01h12V43.97H18zm0-12.018h9v-2.003h-9zm0 6.01h33V37.96H18zm19 22.033H14V27.945h23v8.012h2v-9.014c0-.553-.448-1.001-1-1.001H13a1 1 0 0 0-1 1.001v36.055A1 1 0 0 0 13 64h25c.552 0 1-.449 1-1.002v-20.03h-2zm31-25.038c0 6.472-5.827 8.723-8.908 9.01L43 45.971V43.97h16c.195-.023 7-.757 7-7.01 0-5.695-5.137-6.85-6.166-7.025a1 1 0 0 1-.825-1.126c-.055-3.218-2.028-4.223-2.883-4.508-1.596-.53-3.375-.023-4.316 1.24a1 1 0 0 1-1.742-.262c-.621-1.742-1.522-2.87-2.775-4.125-3.134-3.114-7.388-3.975-11.368-2.3-2.088.88-3.913 2.875-5.003 5.474l-1.844-.777c1.292-3.076 3.506-5.461 6.072-6.543 4.755-2.002 9.821-.981 13.554 2.727 1.07 1.073 1.956 2.117 2.646 3.47 1.493-1.106 3.507-1.437 5.407-.805 2.432.81 3.97 2.922 4.218 5.73 3.406.86 7.025 3.583 7.025 8.83"
      />
    </g>
  </svg>
)}
export default SvgCloudFormation
