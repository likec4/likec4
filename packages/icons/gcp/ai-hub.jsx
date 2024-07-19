/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgAiHub = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-1{fill:#4285f4;fill-rule:evenodd}.cls-3{fill:#aecbfa}.cls-5{fill:#669df6}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path d="M20.69 12.43 12 16.78V22l8.69-4.35z" className="cls-1" />
      <path d="M6.78 4.61 3.31 6.35Z" fillRule="evenodd" fill="#1e88e5" />
      <path d="M17.22 8.09v4.34l3.47-1.73V6.35zM12 15.04l3.48-1.73V8.96L12 10.7z" className="cls-1" />
      <path d="M6.78 4.61 3.31 6.35l3.47 1.74 3.48-1.74z" className="cls-3" />
      <path d="M12 2 8.52 3.74 12 5.48l5.22 2.61 3.47-1.74z" fillRule="evenodd" fill="#aecbfa" />
      <path d="M12 7.22 8.52 8.96 12 10.7l3.48-1.74z" className="cls-3" />
      <path
        d="M8.52 15v5.22L12 22v-5.22Zm2.61 5.22-1.74-.87v-2.57l1.74.87ZM3.31 6.35v11.3l3.47 1.74V8.09Zm2.61 11.3-1.75-.87v-10l1.75.87ZM8.52 9 12 10.7V15l-3.48-1.69Zm2.61 4.35v-3l-1.74-.9v3Z"
        className="cls-5"
      />
    </g>
  </svg>
)
export default SvgAiHub
