import type { SVGProps } from 'react'
const SvgTorchServe = (props: SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="100%" y2="0%">
        <stop offset="0%" stopColor="#055F4E" />
        <stop offset="100%" stopColor="#56C0A7" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <path fill="url(#a)" d="M0 0h80v80H0z" />
      <path
        fill="#FFF"
        d="M46.24 21.103a2.33 2.33 0 0 0 2.33 2.329 2.33 2.33 0 0 0 2.328-2.329 2.33 2.33 0 0 0-2.329-2.329 2.33 2.33 0 0 0-2.329 2.329m-2 0a4.334 4.334 0 0 1 4.33-4.329 4.334 4.334 0 0 1 4.328 4.329 4.334 4.334 0 0 1-4.329 4.329 4.334 4.334 0 0 1-4.329-4.329M63.115 43.89c0 12.99-10.568 23.558-23.558 23.558S16 56.88 16 43.89c0-6.449 2.555-12.468 7.196-16.949L38.808 12l1.383 1.445-15.609 14.938C20.34 32.48 18 37.989 18 43.89c0 11.887 9.671 21.558 21.557 21.558 11.887 0 21.558-9.671 21.558-21.558 0-5.962-2.38-11.51-6.7-15.621l1.378-1.449c4.721 4.492 7.322 10.554 7.322 17.07"
      />
    </g>
  </svg>
)
export default SvgTorchServe
