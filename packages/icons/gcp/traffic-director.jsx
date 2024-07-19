/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgTrafficDirector = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:#4285f4}.cls-2{fill:#669df6}.cls-3{fill:#aecbfa}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path d="M9 15a6.22 6.22 0 0 0-4-5V8a8.22 8.22 0 0 1 6 7Z" className="cls-1" />
      <g data-name="colored-32/traffic-director">
        <path d="M5 7v4L2 9Zm6 8.39V18H9v-2.62" className="cls-1" />
        <path id="Combined-Shape-2" d="M9 5H8l2-3 2 3h-1v13H9Z" className="cls-2" data-name="Combined-Shape" />
      </g>
      <g data-name="colored-32/traffic-director">
        <path id="Combined-Shape-3" d="M19 17v-4l3 2Zm-6-8.38V6h2v2.62" className="cls-3" data-name="Combined-Shape" />
        <path id="Combined-Shape-4" d="M15 19h1l-2 3-2-3h1V6h2Z" className="cls-2" data-name="Combined-Shape" />
      </g>
      <path d="M13 6h2v2.43A6.13 6.13 0 0 0 19 14v2a8.15 8.15 0 0 1-6-7.58" className="cls-3" />
    </g>
  </svg>
)
export default SvgTrafficDirector
