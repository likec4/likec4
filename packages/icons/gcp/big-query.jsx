/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgBigQuery = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1,.cls-2{fill:#aecbfa;fill-rule:evenodd}.cls-2{fill:#669df6}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path d="M6.73 10.83v2.63a4.9 4.9 0 0 0 1.71 1.74v-4.37Z" className="cls-1" />
      <path d="M9.89 8.41v7.53A8 8 0 0 0 11 16a8 8 0 0 0 1 0V8.41Z" className="cls-2" />
      <path d="M13.64 11.86v3.29a5 5 0 0 0 1.7-1.82v-1.47Z" className="cls-1" />
      <path
        d="m17.74 16.32-1.42 1.42a.42.42 0 0 0 0 .6l3.54 3.54a.42.42 0 0 0 .59 0l1.43-1.43a.42.42 0 0 0 0-.59l-3.54-3.54a.42.42 0 0 0-.6 0"
        fillRule="evenodd"
        fill="#4285f4"
      />
      <path
        d="M11 2a9 9 0 1 0 9 9 9 9 0 0 0-9-9m0 15.69A6.68 6.68 0 1 1 17.69 11 6.68 6.68 0 0 1 11 17.69"
        className="cls-2"
      />
    </g>
  </svg>
)
export default SvgBigQuery
