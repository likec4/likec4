import clsx from 'clsx'
import { forwardRef, type SVGProps } from 'react'

export const ZoomIn = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(({ className, ...props }, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    className={clsx('icon icon-tabler icon-tabler-zoom-in', className)}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
    <path d="M7 10l6 0" />
    <path d="M10 7l0 6" />
    <path d="M21 21l-6 -6" />
  </svg>
))
