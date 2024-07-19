/**
 * @component
 * @param {React.SVGProps<SVGSVGElement>} props - The component props.
 * @returns {React.JSX.Element} - The rendered SVG component.
 */
const SvgCloudBuild = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <defs>
      <style>{'.cls-3{fill:#aecbfa}'}</style>
    </defs>
    <g data-name="Product Icons">
      <path d="m12.15 16.24 3.52-2.03v-4.06l-1.18-.69-3.52 6.1z" fill="#4285f4" />
      <path d="M8.63 10.15v4.06l1.18.68 3.53-6.09-1.19-.69z" fill="#669df6" />
      <path
        d="m11.46 17.45-4.22-2.44v-4.86L3.49 7.98v9.2l7.97 4.6zM7.93 8.95l4.22-2.44 4.22 2.44 3.76-2.17-7.98-4.61-7.98 4.61zM17.06 15.01l-4.22 2.44v4.33l7.98-4.6v-9.2l-3.76 2.17z"
        className="cls-3"
      />
    </g>
  </svg>
)
export default SvgCloudBuild
