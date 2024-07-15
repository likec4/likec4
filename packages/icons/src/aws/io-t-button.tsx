import type { SVGProps } from 'react'
const SvgIoTButton = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={80} height={80} {...props}>
    <defs>
      <linearGradient id="IoT-Button_svg__a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#1B660F" />
        <stop offset="100%" stopColor="#6CAE3E" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#IoT-Button_svg__a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M41.5 42.502a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M48 40c0 3.309 2.691 6 6 6s6-2.691 6-6-2.691-6-6-6-6 2.691-6 6m-2 0c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8-8-3.589-8-8m-31 0c0 5.794 3.785 10 9 10q.045 0 .089.004h31.822Q55.955 50 56 50c5.215 0 9-4.206 9-10 0-5.792-3.785-9.996-9-9.996q-.045 0-.089-.004H24.089l-.089.004c-5.215 0-9 4.204-9 9.996m-2 0c0-6.917 4.581-11.947 10.907-11.996Q23.954 28 24 28h32q.047 0 .093.004C62.419 28.053 67 33.083 67 40c0 6.92-4.581 11.951-10.907 12q-.046.004-.093.004H24q-.046 0-.093-.004C17.581 51.951 13 46.919 13 40m4-23h9v-2H16a1 1 0 0 0-1 1v10h2zm46 9h2V16a1 1 0 0 0-1-1H54v2h9zM17 54h-2v10a1 1 0 0 0 1 1h10v-2h-9zm46 0h2v10a1 1 0 0 1-1 1H54v-2h9z"
      />
    </g>
  </svg>
)
export default SvgIoTButton
