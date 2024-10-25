// @ts-nocheck

import type { SVGProps } from 'react'
import { randomString } from 'remeda'
const SvgCloudTasks = (props: SVGProps<SVGSVGElement>) => {
const suffix = randomString(6)
return (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-2{fill:#669df6}.cls-3{fill:#4285f4}'}</style>
    </defs>
    <g data-name="Product Icons">
      <g data-name="colored-32/tasks">
        <path d="M0 0h24v24H0z" fill="none" />
        <path d="M11 5h2v7h-2z" className="cls-2" />
        <path id={`Rectangle-path-2-${suffix}`} d="M11 12h2v7h-2z" className="cls-3" data-name="Rectangle-path" />
        <g data-name="art1">
          <path id={`Rectangle-path-3-${suffix}`} d="M15 5h2v7h-2z" className="cls-2" data-name="Rectangle-path" />
          <path id={`Rectangle-path-4-${suffix}`} d="M15 12h2v7h-2z" className="cls-3" data-name="Rectangle-path" />
        </g>
        <g data-name="art1">
          <path id={`Rectangle-path-5-${suffix}`} d="M19 5h2v7h-2z" className="cls-2" data-name="Rectangle-path" />
          <path id={`Rectangle-path-6-${suffix}`} d="M19 12h2v7h-2z" className="cls-3" data-name="Rectangle-path" />
        </g>
        <g data-name="art1">
          <path id={`Rectangle-path-7-${suffix}`} d="M7 5h2v7H7z" className="cls-2" data-name="Rectangle-path" />
          <path id={`Rectangle-path-8-${suffix}`} d="M7 12h2v7H7z" className="cls-3" data-name="Rectangle-path" />
        </g>
        <g data-name="art1">
          <path id={`Rectangle-path-9-${suffix}`} d="M3 5h2v7H3z" className="cls-2" data-name="Rectangle-path" />
          <path id={`Rectangle-path-10-${suffix}`} d="M3 12h2v7H3z" className="cls-3" data-name="Rectangle-path" />
        </g>
      </g>
    </g>
  </svg>
)}
export default SvgCloudTasks
